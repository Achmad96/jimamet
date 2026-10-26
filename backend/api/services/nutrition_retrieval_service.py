import os
import re
import csv
import logging
import threading
from typing import Optional, Dict, Any, List
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class NutritionRetrievalService:
    """
    Information Retrieval (IR) service using dual-channel TF-IDF (word + char n-grams)
    and Cosine Similarity to match food names predicted by the food detection model
    (e.g., YOLOv8) against the Indonesian Food Nutrition database.
    """

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # Look for indonesian_foods_nutrition.csv in codes/ or backend/
    _CANDIDATE_PATHS = [
        os.path.join(os.path.dirname(BASE_DIR), "indonesian_foods_nutrition.csv"),
        os.path.join(BASE_DIR, "indonesian_foods_nutrition.csv"),
        os.path.join(os.path.dirname(os.path.dirname(BASE_DIR)), "indonesian_foods_nutrition.csv"),
    ]

    # Indonesian food descriptor stop words that add noise to retrieval
    _STOP_DESCRIPTORS = {
        "masakan", "segar", "mentah", "kering", "rebus", "kukus",
        "dengan", "dan", "rasa", "ala", "var", "sedang", "asli",
    }

    _lock = threading.Lock()
    _is_initialized = False
    _records: List[Dict[str, Any]] = []
    _cleaned_corpus: List[str] = []
    _vec_word: Optional[TfidfVectorizer] = None
    _vec_char: Optional[TfidfVectorizer] = None
    _matrix_word = None
    _matrix_char = None
    _active_csv_path: Optional[str] = None

    @classmethod
    def _find_csv_path(cls) -> Optional[str]:
        for path in cls._CANDIDATE_PATHS:
            if os.path.exists(path):
                return path
        return None

    @classmethod
    def _clean_text(cls, text: str, remove_descriptors: bool = True) -> str:
        """
        Normalize and clean a food query or document string:
        - Lowercases
        - Replaces underscores and hyphens with spaces
        - Strips punctuation and parentheses
        - Optionally removes non-distinctive descriptor tokens ('masakan', 'segar', etc.)
        - Normalizes whitespace
        """
        if not text:
            return ""
        text = text.lower().replace("_", " ").replace("-", " ")
        text = re.sub(r"[^\w\s]", " ", text)
        tokens = text.split()
        if remove_descriptors:
            filtered = [t for t in tokens if t not in cls._STOP_DESCRIPTORS]
            # Fall back to un-filtered tokens if all words were removed
            if filtered:
                tokens = filtered
        return " ".join(tokens).strip()

    @classmethod
    def _parse_val(cls, val_str: Any) -> float:
        """Extract numeric float from string like '296 kkal' or '20.30 g'."""
        if not val_str:
            return 0.0
        match = re.search(r"[\d\.]+", str(val_str))
        return float(match.group()) if match else 0.0

    @classmethod
    def initialize(cls, csv_path: Optional[str] = None) -> bool:
        """
        Loads the nutritional database CSV and indexes food items into TF-IDF vector spaces.
        Vectorization is cached in memory for sub-millisecond retrieval.
        """
        with cls._lock:
            if cls._is_initialized and not csv_path:
                return True

            path = csv_path or cls._find_csv_path()
            if not path or not os.path.exists(path):
                logger.error(f"[NutritionRetrieval] CSV database not found. Checked: {cls._CANDIDATE_PATHS}")
                return False

            try:
                records = []
                cleaned_corpus = []

                with open(path, newline="", encoding="utf-8") as csvfile:
                    reader = csv.DictReader(csvfile)
                    for row in reader:
                        food_name = row.get("food_name", "").strip()
                        if not food_name or food_name.lower() == "unknown":
                            continue

                        cleaned = cls._clean_text(food_name)
                        if not cleaned:
                            continue

                        records.append({
                            "food_name": food_name,
                            "energy_100g": cls._parse_val(row.get("energy")),
                            "fat_100g": cls._parse_val(row.get("total_fat")),
                            "carbs_100g": cls._parse_val(row.get("total_carbohydrates")),
                            "protein_100g": cls._parse_val(row.get("protein")),
                            "raw_row": row,
                        })
                        cleaned_corpus.append(cleaned)

                if not records:
                    logger.warning(f"[NutritionRetrieval] No valid records loaded from {path}")
                    return False

                # 1. Word-level n-grams (1, 2) with sublinear term-frequency scaling
                cls._vec_word = TfidfVectorizer(
                    ngram_range=(1, 2),
                    analyzer="word",
                    sublinear_tf=True
                )
                cls._matrix_word = cls._vec_word.fit_transform(cleaned_corpus)

                # 2. Character n-grams (3, 5) with word boundaries for morphology/compounding resilience
                cls._vec_char = TfidfVectorizer(
                    ngram_range=(3, 5),
                    analyzer="char_wb",
                    sublinear_tf=True
                )
                cls._matrix_char = cls._vec_char.fit_transform(cleaned_corpus)

                cls._records = records
                cls._cleaned_corpus = cleaned_corpus
                cls._active_csv_path = path
                cls._is_initialized = True

                logger.info(
                    f"[NutritionRetrieval] Successfully indexed {len(records)} food records from '{path}' "
                    "using dual Word+Char TF-IDF Vectorizers."
                )
                return True
            except Exception as e:
                logger.error(f"[NutritionRetrieval] Failed to initialize TF-IDF index: {e}")
                return False

    @classmethod
    def retrieve(
        cls,
        food_query: str,
        threshold: float = 0.40,
        word_weight: float = 0.55,
        char_weight: float = 0.45,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves the best matching food record from the nutrition database using TF-IDF cosine similarity.

        Args:
            food_query: Raw label string output from YOLO model (e.g. 'Ayam_Bakar', 'Tempe_Mendoan')
            threshold: Minimum cosine similarity score to consider a match valid.
            word_weight: Weight for word-level TF-IDF similarity.
            char_weight: Weight for character n-gram TF-IDF similarity.

        Returns:
            Dictionary containing matched nutrition profile and retrieval score,
            or None if no document matches above threshold.
        """
        if not cls._is_initialized:
            if not cls.initialize():
                return None

        clean_query = cls._clean_text(food_query)
        if not clean_query:
            return None

        # 1. Check exact match on cleaned name (highest priority)
        for i, corpus_text in enumerate(cls._cleaned_corpus):
            if clean_query == corpus_text:
                matched_rec = cls._records[i]
                return {
                    **matched_rec,
                    "similarity_score": 1.0,
                    "query": food_query,
                    "clean_query": clean_query,
                    "match_type": "exact",
                }

        # 2. Vectorize query with both TF-IDF models
        try:
            q_vec_word = cls._vec_word.transform([clean_query])
            q_vec_char = cls._vec_char.transform([clean_query])

            sim_word = cosine_similarity(q_vec_word, cls._matrix_word)[0]
            sim_char = cosine_similarity(q_vec_char, cls._matrix_char)[0]

            # Weighted combination of word and character n-gram cosine similarities
            scores = (word_weight * sim_word) + (char_weight * sim_char)

            # Indonesian head-noun bonus: prioritize entries where query matches the head noun (first word)
            query_first_token = clean_query.split()[0] if clean_query else ""
            for idx, corpus_text in enumerate(cls._cleaned_corpus):
                if corpus_text.startswith(clean_query):
                    # Strong prefix match (e.g., query "rendang" matching "rendang sapi")
                    scores[idx] += 0.15
                elif query_first_token and corpus_text.startswith(query_first_token):
                    # Head-noun prefix match
                    scores[idx] += 0.08

            best_idx = int(np.argmax(scores))
            best_score = float(scores[best_idx])

            if best_score < threshold:
                logger.info(
                    f"[NutritionRetrieval] Query '{food_query}' best candidate "
                    f"'{cls._records[best_idx]['food_name']}' score {best_score:.3f} < threshold {threshold}. "
                    "Routing to fallback."
                )
                return None

            matched_rec = cls._records[best_idx]
            return {
                **matched_rec,
                "similarity_score": round(best_score, 4),
                "query": food_query,
                "clean_query": clean_query,
                "match_type": "tfidf_cosine",
            }

        except Exception as e:
            logger.error(f"[NutritionRetrieval] Retrieval error for '{food_query}': {e}")
            return None

    @classmethod
    def retrieve_top_k(
        cls,
        food_query: str,
        k: int = 3,
        threshold: float = 0.20,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-k candidate food matches with similarity scores.
        Useful for multi-candidate inspection or disambiguation.
        """
        if not cls._is_initialized:
            if not cls.initialize():
                return []

        clean_query = cls._clean_text(food_query)
        if not clean_query:
            return []

        try:
            q_vec_word = cls._vec_word.transform([clean_query])
            q_vec_char = cls._vec_char.transform([clean_query])

            sim_word = cosine_similarity(q_vec_word, cls._matrix_word)[0]
            sim_char = cosine_similarity(q_vec_char, cls._matrix_char)[0]
            scores = (0.55 * sim_word) + (0.45 * sim_char)

            top_indices = np.argsort(scores)[::-1][:k]
            results = []
            for idx in top_indices:
                score = float(scores[idx])
                if score >= threshold:
                    rec = cls._records[idx]
                    results.append({
                        **rec,
                        "similarity_score": round(score, 4),
                        "query": food_query,
                    })
            return results
        except Exception as e:
            logger.error(f"[NutritionRetrieval] top-k retrieval error: {e}")
            return []


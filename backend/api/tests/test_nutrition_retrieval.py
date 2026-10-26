import unittest
from api.services.nutrition_retrieval_service import NutritionRetrievalService
from api.services.detection_service import DetectionService


class TestNutritionRetrievalService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        NutritionRetrievalService.initialize()

    def test_exact_match(self):
        """Exact matches should have similarity_score == 1.0 and match_type == 'exact'."""
        result = NutritionRetrievalService.retrieve("Ayam_Bakar")
        self.assertIsNotNone(result)
        self.assertEqual(result["food_name"].lower(), "ayam bakar")
        self.assertEqual(result["similarity_score"], 1.0)
        self.assertEqual(result["match_type"], "exact")
        self.assertGreater(result["energy_100g"], 0)

    def test_exact_match_tempe_mendoan(self):
        result = NutritionRetrievalService.retrieve("Tempe_Mendoan")
        self.assertIsNotNone(result)
        self.assertEqual(result["food_name"].lower(), "tempe mendoan")
        self.assertEqual(result["similarity_score"], 1.0)

    def test_fuzzy_match_rendang(self):
        """Fuzzy TF-IDF match for 'Rendang' should retrieve beef rendang."""
        result = NutritionRetrievalService.retrieve("Rendang", threshold=0.40)
        self.assertIsNotNone(result)
        self.assertIn("rendang", result["food_name"].lower())
        self.assertGreaterEqual(result["similarity_score"], 0.40)

    def test_fuzzy_match_bakso(self):
        result = NutritionRetrievalService.retrieve("Bakso", threshold=0.40)
        self.assertIsNotNone(result)
        self.assertIn("bakso", result["food_name"].lower())

    def test_unknown_food_returns_none(self):
        """Unknown or nonsensical foods should fall below the threshold and return None."""
        result = NutritionRetrievalService.retrieve("Cosmic_Quantum_Soup_12345", threshold=0.40)
        self.assertIsNone(result)

    def test_retrieve_top_k(self):
        """retrieve_top_k should return a list sorted by similarity score descending."""
        candidates = NutritionRetrievalService.retrieve_top_k("Ayam", k=3)
        self.assertGreater(len(candidates), 0)
        self.assertLessEqual(len(candidates), 3)
        for i in range(len(candidates) - 1):
            self.assertGreaterEqual(candidates[i]["similarity_score"], candidates[i + 1]["similarity_score"])

    def test_detection_service_integration(self):
        """DetectionService._get_nutrition_data should successfully use TF-IDF retrieval."""
        data = DetectionService._get_nutrition_data("Ayam_Bakar")
        self.assertIsNotNone(data)
        self.assertEqual(data["source"], "csv")
        self.assertIn("matched_food_name", data)
        self.assertGreater(data["calories"], 0)


if __name__ == "__main__":
    unittest.main()


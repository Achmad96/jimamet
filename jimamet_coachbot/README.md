# CoachBot — Asisten Kesehatan & Nutrisi

Chatbot berbasis Gemini AI untuk menjawab pertanyaan kesehatan dan menganalisis kandungan nutrisi dari foto makanan.

## Cara Kerja

React (frontend) → FastAPI (port 8001) → Gemini API (AI)

## Teknologi

- **Backend:** Python, FastAPI, Google Gemini API (gemini-2.5-flash)
- **Library:** google-genai, Pillow, python-dotenv

## Cara Menjalankan

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Isi file `.env`

```
GEMINI_API_KEY=api-key-kamu-dari-aistudio
```

Ambil dari https://aistudio.google.com/apikey

### 3. Jalankan server

```bash
python rest_api.py
```

Server berjalan di http://localhost:8001

Dokumentasi interaktif: http://localhost:8001/docs

## Endpoint

| Method | URL | Body | Response |
|--------|-----|------|----------|
| POST | `/api/chat` | `{ message }` | `{ reply }` |
| POST | `/api/analyze-food` | `{ image_base64 }` | `{ description, calories, nutrients, saran }` |

## Struktur Folder

```
jimamet_coachbot/
├── coachbot_service.py   # Logika Gemini API
├── rest_api.py           # Endpoint FastAPI
├── .env                  # API key Gemini
├── .gitignore
├── requirements.txt
└── README.md
```

---

**Dev3** — SP7: Fitur CoachBot

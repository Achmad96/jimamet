# Authentication Service — Login & Register

Project autentikasi untuk tugas kuliah SP7 oleh Dev3. User bisa register, login, dan logout lewat tampilan web.

## Cara Kerja

React (tampilan web) → FastAPI (penerus data) → gRPC Server (proses logika) → Supabase (database)

## Teknologi

- **Backend:** Python, gRPC, FastAPI, Supabase, bcrypt
- **Frontend:** React, Vite, React Router

## Cara Menjalankan

### 1. Siapkan dulu

```bash
pip install -r requirements.txt
cd frontend && npm install
```

### 2. Isi file `.env` dengan data Supabase

```
SUPABASE_URL=https://projectid-kamu.supabase.co
SUPABASE_KEY=api-key-kamu
```

Ambil dari Supabase Dashboard → Settings → API.

### 3. Jalankan 3 terminal

```bash
python auth_server.py        # Terminal 1 — backend gRPC (port 50051)
python rest_api.py            # Terminal 2 — REST API (port 8000)
cd frontend && npm run dev    # Terminal 3 — tampilan web (port 5173)
```

### 4. Buka http://localhost:5173 di browser

## Endpoint REST API

| Method | URL | Body | Response |
|--------|-----|------|----------|
| POST | `/api/register` | `{ name, email, password }` | `{ success, message }` |
| POST | `/api/login` | `{ email, password }` | `{ success, message, token }` |
| POST | `/api/logout` | `{ token }` | `{ success, message }` |

Dokumentasi interaktif: http://localhost:8000/docs

## Struktur Folder

```
├── auth_server.py          # Server gRPC
├── rest_api.py             # REST API (FastAPI)
├── database.py             # Operasi database
├── protos/auth.proto       # Definisi layanan gRPC
├── generated/              # Hasil compile proto (jangan diedit)
├── test_client.py          # Script test otomatis
├── .env                    # API key Supabase (jangan di-push ke GitHub)
└── frontend/src/
    ├── pages/Login.jsx     # Halaman login
    ├── pages/Register.jsx  # Halaman register
    ├── pages/Home.jsx      # Halaman setelah login
    └── api.js              # Fungsi pemanggil API
```

## Catatan

- Password di-hash pakai bcrypt, tidak pernah disimpan mentah
- Token sesi hilang kalau server di-restart (disimpan di RAM)
- Kalau mau test tanpa buka browser, jalankan `python test_client.py`

---

**Dev3** — SP7: Fitur Login & Registrasi

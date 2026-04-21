"""
database.py - Modul untuk menghubungkan Python ke Supabase
==========================================================
File ini berisi semua fungsi yang berhubungan dengan database:
- Koneksi ke Supabase
- Simpan user baru (register)
- Cari user berdasarkan email (login)
- Simpan dan hapus token sesi (login/logout)
"""

import os
import bcrypt
import uuid
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Muat variabel dari file .env (SUPABASE_URL dan SUPABASE_KEY)
load_dotenv()

# Ambil URL dan API key dari file .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Buat koneksi ke Supabase
# Variabel 'supabase' ini yang akan dipakai untuk semua operasi database
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================================
# Daftar untuk menyimpan token sesi yang aktif
# Token ini dibuat saat user login dan dihapus saat logout
# ============================================================
# Catatan: Ini disimpan di memori (RAM), jadi akan hilang
# kalau server di-restart. Untuk production, simpan di database.
# Untuk tugas kuliah, cara ini sudah cukup.
# ============================================================
active_tokens = {}


def hash_password(password: str) -> str:
    """
    Mengenkripsi password supaya aman disimpan di database.
    
    Cara kerja:
    - Password asli (misal: "rahasia123") diubah menjadi
      string acak yang tidak bisa dibaca (misal: "$2b$12$xyz...")
    - Ini disebut "hashing" — proses satu arah (tidak bisa di-balik)
    
    Parameter:
        password: Password asli dari user
    
    Return:
        String password yang sudah di-hash
    """
    # Buat "salt" (tambahan acak supaya hash lebih aman)
    salt = bcrypt.gensalt()
    # Hash password dengan salt
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    # Kembalikan sebagai string (bukan bytes)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Memeriksa apakah password yang dimasukkan cocok dengan yang di database.
    
    Cara kerja:
    - Bandingkan password asli dengan password yang sudah di-hash
    - Kalau cocok, return True (benar)
    - Kalau tidak cocok, return False (salah)
    
    Parameter:
        password: Password yang dimasukkan user saat login
        hashed_password: Password yang sudah di-hash (dari database)
    
    Return:
        True kalau cocok, False kalau tidak cocok
    """
    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_user(name: str, email: str, password: str) -> dict:
    """
    Menyimpan user baru ke database Supabase (untuk fitur Register).
    
    Langkah-langkah:
    1. Cek apakah email sudah terdaftar
    2. Kalau belum, hash password-nya
    3. Simpan data user ke tabel 'users'
    
    Parameter:
        name: Nama lengkap user
        email: Email user
        password: Password asli (akan di-hash sebelum disimpan)
    
    Return:
        Dictionary berisi status dan pesan hasil registrasi
    """
    try:
        # Langkah 1: Cek apakah email sudah terdaftar
        existing_user = supabase.table("users").select("id").eq("email", email).execute()

        # Kalau data ditemukan (tidak kosong), berarti email sudah dipakai
        if existing_user.data and len(existing_user.data) > 0:
            return {
                "success": False,
                "message": "Email sudah terdaftar. Silakan gunakan email lain."
            }

        # Langkah 2: Hash password sebelum disimpan
        hashed_pw = hash_password(password)

        # Langkah 3: Simpan user baru ke tabel 'users'
        now = datetime.utcnow().isoformat()
        new_user = {
            "name": name,
            "email": email,
            "password": hashed_pw,
            "created_at": now,
            "updated_at": now
        }

        result = supabase.table("users").insert(new_user).execute()

        # Cek apakah insert berhasil
        if result.data:
            return {
                "success": True,
                "message": "Registrasi berhasil! Silakan login."
            }
        else:
            return {
                "success": False,
                "message": "Gagal menyimpan data. Coba lagi nanti."
            }

    except Exception as e:
        # Tangkap error yang tidak terduga
        return {
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}"
        }


def authenticate_user(email: str, password: str) -> dict:
    """
    Memverifikasi kredensial user (untuk fitur Login).
    
    Langkah-langkah:
    1. Cari user berdasarkan email
    2. Kalau ditemukan, cocokkan password-nya
    3. Kalau cocok, buat token sesi
    
    Parameter:
        email: Email yang dimasukkan user
        password: Password yang dimasukkan user
    
    Return:
        Dictionary berisi status, pesan, dan token (kalau berhasil)
    """
    try:
        # Langkah 1: Cari user berdasarkan email
        result = supabase.table("users").select("*").eq("email", email).execute()

        # Kalau tidak ditemukan
        if not result.data or len(result.data) == 0:
            return {
                "success": False,
                "message": "Email tidak ditemukan. Silakan register terlebih dahulu.",
                "token": ""
            }

        # Ambil data user pertama yang ditemukan
        user = result.data[0]

        # Langkah 2: Cocokkan password
        if not verify_password(password, user["password"]):
            return {
                "success": False,
                "message": "Password salah. Silakan coba lagi.",
                "token": ""
            }

        # Langkah 3: Buat token sesi (berupa UUID acak)
        token = str(uuid.uuid4())

        # Simpan token ke daftar token aktif beserta info user
        active_tokens[token] = {
            "user_id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }

        return {
            "success": True,
            "message": f"Login berhasil! Selamat datang, {user['name']}.",
            "token": token
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}",
            "token": ""
        }


def remove_token(token: str) -> dict:
    """
    Menghapus token sesi (untuk fitur Logout).
    
    Cara kerja:
    - Cari token di daftar token aktif
    - Kalau ditemukan, hapus dari daftar
    - Kalau tidak ditemukan, berarti token tidak valid
    
    Parameter:
        token: Token sesi yang ingin di-logout
    
    Return:
        Dictionary berisi status dan pesan hasil logout
    """
    # Cek apakah token ada di daftar aktif
    if token in active_tokens:
        # Ambil info user sebelum dihapus (untuk pesan)
        user_info = active_tokens[token]
        # Hapus token dari daftar aktif
        del active_tokens[token]
        return {
            "success": True,
            "message": f"Logout berhasil. Sampai jumpa, {user_info['name']}!"
        }
    else:
        return {
            "success": False,
            "message": "Token tidak valid atau sudah expired."
        }

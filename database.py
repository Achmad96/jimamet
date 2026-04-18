import os
import bcrypt
import uuid
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

active_tokens = {}


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_user(name: str, email: str, password: str) -> dict:
    try:
        existing_user = supabase.table("users").select("id").eq("email", email).execute()

        if existing_user.data and len(existing_user.data) > 0:
            return {
                "success": False,
                "message": "Email sudah terdaftar. Silakan gunakan email lain."
            }

        hashed_pw = hash_password(password)

        now = datetime.utcnow().isoformat()
        new_user = {
            "name": name,
            "email": email,
            "password": hashed_pw,
            "created_at": now,
            "updated_at": now
        }

        result = supabase.table("users").insert(new_user).execute()

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
        return {
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}"
        }


def authenticate_user(email: str, password: str) -> dict:
    try:
        result = supabase.table("users").select("*").eq("email", email).execute()

        if not result.data or len(result.data) == 0:
            return {
                "success": False,
                "message": "Email tidak ditemukan. Silakan register terlebih dahulu.",
                "token": ""
            }

        user = result.data[0]

        if not verify_password(password, user["password"]):
            return {
                "success": False,
                "message": "Password salah. Silakan coba lagi.",
                "token": ""
            }

        token = str(uuid.uuid4())

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
    if token in active_tokens:
        user_info = active_tokens[token]
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

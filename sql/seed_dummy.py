import os
import sys
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

password = hash_pw("password123")
now = datetime.utcnow().isoformat()

users_data = [
    {"id": "a1111111-1111-1111-1111-111111111111", "name": "Budi Santoso", "email": "budi@example.com", "password": password, "created_at": now, "updated_at": now},
    {"id": "b2222222-2222-2222-2222-222222222222", "name": "Sari Rahayu", "email": "sari@example.com", "password": password, "created_at": now, "updated_at": now},
    {"id": "c3333333-3333-3333-3333-333333333333", "name": "Andi Pratama", "email": "andi@example.com", "password": password, "created_at": now, "updated_at": now},
]

profiles_data = [
    {"id": "a1111111-1111-1111-1111-111111111111", "weight": 88.5, "height": 170, "age": 25, "job": "Karyawan Swasta", "activity": "ringan", "created_at": now, "updated_at": now},
    {"id": "b2222222-2222-2222-2222-222222222222", "weight": 55.0, "height": 160, "age": 30, "job": "Guru SMA", "activity": "sedang", "created_at": now, "updated_at": now},
    {"id": "c3333333-3333-3333-3333-333333333333", "weight": 52.0, "height": 175, "age": 22, "job": "Mahasiswa", "activity": "berat", "created_at": now, "updated_at": now},
]

def ts(hours_ago):
    return (datetime.utcnow() - timedelta(hours=hours_ago)).isoformat()

history_data = [
    {"user_id": "a1111111-1111-1111-1111-111111111111", "food_name": "Nasi Goreng Spesial", "calories": 650, "protein": 18, "carbs": 85, "fat": 25, "consumed_at": ts(4)},
    {"user_id": "a1111111-1111-1111-1111-111111111111", "food_name": "Teh Manis Dingin", "calories": 120, "protein": 0, "carbs": 30, "fat": 0, "consumed_at": ts(4)},
    {"user_id": "a1111111-1111-1111-1111-111111111111", "food_name": "Ayam Geprek + Nasi", "calories": 750, "protein": 30, "carbs": 80, "fat": 35, "consumed_at": ts(8)},
    {"user_id": "a1111111-1111-1111-1111-111111111111", "food_name": "Es Kopi Susu Gula Aren", "calories": 250, "protein": 3, "carbs": 40, "fat": 8, "consumed_at": ts(6)},
    {"user_id": "a1111111-1111-1111-1111-111111111111", "food_name": "Indomie Goreng 2 Bungkus", "calories": 760, "protein": 16, "carbs": 96, "fat": 34, "consumed_at": ts(12)},

    {"user_id": "b2222222-2222-2222-2222-222222222222", "food_name": "Oatmeal + Pisang + Madu", "calories": 320, "protein": 8, "carbs": 55, "fat": 6, "consumed_at": ts(4)},
    {"user_id": "b2222222-2222-2222-2222-222222222222", "food_name": "Nasi + Ikan Bakar + Sayur Bayam", "calories": 450, "protein": 28, "carbs": 50, "fat": 12, "consumed_at": ts(8)},
    {"user_id": "b2222222-2222-2222-2222-222222222222", "food_name": "Jus Alpukat Tanpa Gula", "calories": 180, "protein": 2, "carbs": 12, "fat": 14, "consumed_at": ts(6)},
    {"user_id": "b2222222-2222-2222-2222-222222222222", "food_name": "Salad Buah", "calories": 150, "protein": 2, "carbs": 35, "fat": 1, "consumed_at": ts(3)},
    {"user_id": "b2222222-2222-2222-2222-222222222222", "food_name": "Sup Ayam + Roti Gandum", "calories": 380, "protein": 22, "carbs": 40, "fat": 10, "consumed_at": ts(12)},

    {"user_id": "c3333333-3333-3333-3333-333333333333", "food_name": "Roti Bakar + Teh", "calories": 200, "protein": 5, "carbs": 35, "fat": 4, "consumed_at": ts(4)},
    {"user_id": "c3333333-3333-3333-3333-333333333333", "food_name": "Nasi + Tahu Goreng", "calories": 350, "protein": 12, "carbs": 50, "fat": 10, "consumed_at": ts(8)},
    {"user_id": "c3333333-3333-3333-3333-333333333333", "food_name": "Mie Instan", "calories": 380, "protein": 8, "carbs": 48, "fat": 17, "consumed_at": ts(12)},
    {"user_id": "c3333333-3333-3333-3333-333333333333", "food_name": "Air Putih", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "consumed_at": ts(2)},
    {"user_id": "c3333333-3333-3333-3333-333333333333", "food_name": "Pisang 1 Buah", "calories": 105, "protein": 1, "carbs": 27, "fat": 0.4, "consumed_at": ts(6)},
]

print("Inserting users...")
supabase.table("users").insert(users_data).execute()
print("  OK - 3 users")

print("Inserting profiles...")
supabase.table("user_profiles").insert(profiles_data).execute()
print("  OK - 3 profiles")

print("Inserting consumption history...")
supabase.table("consumption_history").insert(history_data).execute()
print("  OK - 15 records")

print("\nSemua data dummy berhasil dimasukkan!")

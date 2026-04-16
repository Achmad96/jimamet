"""
auth_server.py - Server gRPC untuk Authentication Service
==========================================================
File ini adalah file utama yang menjalankan gRPC server.
Di sinilah logika Register, Login, dan Logout diimplementasikan.

Cara menjalankan:
    python auth_server.py

Server akan berjalan di port 50051
"""

import sys
import os
import grpc
from concurrent import futures

# Tambahkan folder 'generated' ke sys.path
# supaya Python bisa menemukan file auth_pb2 dan auth_pb2_grpc
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "generated"))

# Import file hasil compile dari .proto
import auth_pb2
import auth_pb2_grpc

# Import fungsi-fungsi database dari database.py
from database import create_user, authenticate_user, remove_token


class AuthServiceServicer(auth_pb2_grpc.AuthServiceServicer):
    """
    Class ini mengimplementasikan semua fungsi yang didefinisikan
    di auth.proto (Register, Login, Logout).
    
    Cara kerjanya:
    - Class ini "mewarisi" (inherit) dari AuthServiceServicer yang
      di-generate otomatis dari file .proto
    - Kita tinggal mengisi logika di setiap fungsinya
    """

    def Register(self, request, context):
        """
        Fungsi untuk mendaftarkan user baru.
        
        Alur:
        1. Terima data (name, email, password) dari client
        2. Panggil fungsi create_user() di database.py
        3. Kirim balasan (berhasil/gagal) ke client
        
        Parameter:
            request: Data dari client (RegisterRequest)
                - request.name    → Nama user
                - request.email   → Email user
                - request.password → Password user
            context: Konteks gRPC (untuk info tambahan)
        
        Return:
            RegisterResponse berisi success (bool) dan message (string)
        """
        # Tampilkan log di terminal supaya kita tahu ada request masuk
        print(f"\n[REGISTER] Request diterima:")
        print(f"   Nama : {request.name}")
        print(f"   Email: {request.email}")

        # Panggil fungsi create_user dari database.py
        result = create_user(
            name=request.name,
            email=request.email,
            password=request.password
        )

        # Tampilkan hasil di terminal
        status = "BERHASIL" if result["success"] else "GAGAL"
        print(f"   Hasil: {status} - {result['message']}")

        # Kirim balasan ke client
        return auth_pb2.RegisterResponse(
            success=result["success"],
            message=result["message"]
        )

    def Login(self, request, context):
        """
        Fungsi untuk login user.
        
        Alur:
        1. Terima data (email, password) dari client
        2. Panggil fungsi authenticate_user() di database.py
        3. Kalau berhasil, kirim token sesi ke client
        
        Parameter:
            request: Data dari client (LoginRequest)
                - request.email    → Email user
                - request.password → Password user
            context: Konteks gRPC
        
        Return:
            LoginResponse berisi success, message, dan token
        """
        print(f"\n[LOGIN] Request diterima:")
        print(f"   Email: {request.email}")

        # Panggil fungsi authenticate_user dari database.py
        result = authenticate_user(
            email=request.email,
            password=request.password
        )

        # Tampilkan hasil di terminal
        status = "BERHASIL" if result["success"] else "GAGAL"
        print(f"   Hasil: {status} - {result['message']}")
        if result["success"]:
            print(f"   Token: {result['token']}")

        # Kirim balasan ke client
        return auth_pb2.LoginResponse(
            success=result["success"],
            message=result["message"],
            token=result["token"]
        )

    def Logout(self, request, context):
        """
        Fungsi untuk logout user.
        
        Alur:
        1. Terima token sesi dari client
        2. Panggil fungsi remove_token() di database.py
        3. Hapus token dari daftar aktif
        
        Parameter:
            request: Data dari client (LogoutRequest)
                - request.token → Token sesi yang mau di-logout
            context: Konteks gRPC
        
        Return:
            LogoutResponse berisi success dan message
        """
        print(f"\n[LOGOUT] Request diterima:")
        print(f"   Token: {request.token}")

        # Panggil fungsi remove_token dari database.py
        result = remove_token(token=request.token)

        # Tampilkan hasil di terminal
        status = "BERHASIL" if result["success"] else "GAGAL"
        print(f"   Hasil: {status} - {result['message']}")

        # Kirim balasan ke client
        return auth_pb2.LogoutResponse(
            success=result["success"],
            message=result["message"]
        )


def serve():
    """
    Fungsi utama untuk menjalankan gRPC server.
    
    Penjelasan:
    - Server berjalan di port 50051 (port standar gRPC)
    - max_workers=10 berarti server bisa menangani 10 request
      secara bersamaan (cukup untuk tugas kuliah)
    - server.wait_for_termination() membuat server terus berjalan
      sampai kita tekan Ctrl+C untuk menghentikannya
    """
    # Buat server gRPC dengan 10 worker threads
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    # Daftarkan AuthServiceServicer ke server
    auth_pb2_grpc.add_AuthServiceServicer_to_server(
        AuthServiceServicer(), server
    )

    # Tentukan port server
    port = "50051"
    server.add_insecure_port(f"[::]:{port}")

    # Jalankan server
    server.start()

    print("=" * 50)
    print("AUTH gRPC SERVER BERJALAN!")
    print(f"Mendengarkan di port: {port}")
    print("Tekan Ctrl+C untuk menghentikan server")
    print("=" * 50)

    # Buat server terus berjalan
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        print("\n\nServer dihentikan oleh user.")
        server.stop(0)


# Jalankan server ketika file ini dieksekusi langsung
if __name__ == "__main__":
    serve()

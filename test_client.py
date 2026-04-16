"""
test_client.py - Client untuk menguji fitur Register dan Login via gRPC
========================================================================
File ini digunakan untuk mengirim request ke gRPC server (auth_server.py)
dan melihat hasilnya di terminal.

Cara menjalankan:
    1. Pastikan server sudah berjalan: python auth_server.py
    2. Buka terminal baru, lalu jalankan: python test_client.py
"""

import sys
import os

# Tambahkan folder 'generated' supaya Python bisa menemukan file proto
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "generated"))

import grpc
import auth_pb2
import auth_pb2_grpc


def test_register(stub, name, email, password):
    """
    Menguji fitur Register (mendaftarkan user baru).

    Parameter:
        stub: gRPC client stub untuk memanggil fungsi di server
        name: Nama lengkap user
        email: Email user
        password: Password user
    """
    print("=" * 50)
    print("TEST REGISTER")
    print("=" * 50)
    print(f"  Nama    : {name}")
    print(f"  Email   : {email}")
    print(f"  Password: {password}")
    print("-" * 50)

    # Kirim request Register ke server
    response = stub.Register(
        auth_pb2.RegisterRequest(
            name=name,
            email=email,
            password=password
        )
    )

    # Tampilkan hasil dari server
    print(f"  Success : {response.success}")
    print(f"  Message : {response.message}")
    print()

    return response


def test_login(stub, email, password):
    """
    Menguji fitur Login (masuk dengan email dan password).

    Parameter:
        stub: gRPC client stub untuk memanggil fungsi di server
        email: Email user
        password: Password user

    Return:
        Token sesi jika login berhasil
    """
    print("=" * 50)
    print("TEST LOGIN")
    print("=" * 50)
    print(f"  Email   : {email}")
    print(f"  Password: {password}")
    print("-" * 50)

    # Kirim request Login ke server
    response = stub.Login(
        auth_pb2.LoginRequest(
            email=email,
            password=password
        )
    )

    # Tampilkan hasil dari server
    print(f"  Success : {response.success}")
    print(f"  Message : {response.message}")
    if response.token:
        print(f"  Token   : {response.token}")
    print()

    return response


def test_logout(stub, token):
    """
    Menguji fitur Logout (keluar dari sesi).

    Parameter:
        stub: gRPC client stub untuk memanggil fungsi di server
        token: Token sesi yang ingin di-logout
    """
    print("=" * 50)
    print("TEST LOGOUT")
    print("=" * 50)
    print(f"  Token   : {token}")
    print("-" * 50)

    # Kirim request Logout ke server
    response = stub.Logout(
        auth_pb2.LogoutRequest(
            token=token
        )
    )

    # Tampilkan hasil dari server
    print(f"  Success : {response.success}")
    print(f"  Message : {response.message}")
    print()

    return response


def main():
    """
    Fungsi utama yang menjalankan semua test secara berurutan.

    Alur test:
    1. Register user baru
    2. Register lagi dengan email yang sama (harus gagal)
    3. Login dengan password benar
    4. Login dengan password salah (harus gagal)
    5. Logout dengan token dari login berhasil
    6. Logout lagi dengan token yang sama (harus gagal)
    """
    # Hubungkan ke server gRPC di localhost port 50051
    channel = grpc.insecure_channel("localhost:50051")
    stub = auth_pb2_grpc.AuthServiceStub(channel)

    print()
    print("########################################")
    print("#   TEST CLIENT - AUTH gRPC SERVICE    #")
    print("########################################")
    print()

    # --- Data user untuk testing ---
    nama = "Andi Pratama"
    email = "andi@example.com"
    password = "rahasia123"

    # ========================================
    # TEST 1: Register user baru (harus berhasil)
    # ========================================
    test_register(stub, nama, email, password)

    # ========================================
    # TEST 2: Register dengan email yang sama (harus gagal)
    # ========================================
    test_register(stub, nama, email, password)

    # ========================================
    # TEST 3: Login dengan password benar (harus berhasil)
    # ========================================
    login_response = test_login(stub, email, password)

    # ========================================
    # TEST 4: Login dengan password salah (harus gagal)
    # ========================================
    test_login(stub, email, "passwordsalah")

    # ========================================
    # TEST 5: Logout dengan token yang valid (harus berhasil)
    # ========================================
    if login_response.token:
        test_logout(stub, login_response.token)

        # ====================================
        # TEST 6: Logout lagi dengan token yang sama (harus gagal)
        # ====================================
        test_logout(stub, login_response.token)

    # Tutup koneksi
    channel.close()

    print("########################################")
    print("#        SEMUA TEST SELESAI!           #")
    print("########################################")


# Jalankan test ketika file ini dieksekusi langsung
if __name__ == "__main__":
    main()

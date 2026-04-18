# 🔐 Authentication gRPC Service

Layanan autentikasi berbasis **gRPC** untuk menangani fitur **Register**, **Login**, dan **Logout** pengguna. Project ini dibangun sebagai bagian dari tugas kuliah **SP7: Fitur Login & Registrasi** oleh **Dev3**.

> **Apa itu gRPC?**
> gRPC adalah framework komunikasi antar aplikasi yang dikembangkan oleh Google. Bayangkan seperti "telepon" antara dua program — satu program (client) bisa memanggil fungsi di program lain (server) seolah-olah fungsi itu ada di komputer yang sama. gRPC lebih cepat dan efisien dibandingkan REST API tradisional karena menggunakan format data binary (Protocol Buffers).

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Python** | 3.14+ | Bahasa pemrograman utama |
| **gRPC** | 1.80.0 | Framework komunikasi client-server |
| **Protocol Buffers** | proto3 | Format definisi layanan dan struktur data |
| **Supabase** | - | Database PostgreSQL berbasis cloud |
| **bcrypt** | 5.0.0 | Enkripsi password supaya aman |
| **python-dotenv** | 1.1.0 | Membaca konfigurasi dari file `.env` |

---

## 📁 Struktur Folder

```
jimamet_login_register/
├── protos/
│   └── auth.proto             # Definisi layanan gRPC & format data
├── generated/
│   ├── __init__.py            # Penanda folder sebagai Python package
│   ├── auth_pb2.py            # Kode Python hasil compile (struktur data)
│   └── auth_pb2_grpc.py       # Kode Python hasil compile (layanan gRPC)
├── auth_server.py             # Server utama yang menjalankan layanan gRPC
├── database.py                # Modul koneksi & operasi database Supabase
├── test_client.py             # Client untuk menguji semua fitur
├── .env                       # Konfigurasi rahasia (API key Supabase)
├── requirements.txt           # Daftar library yang dibutuhkan
└── README.md                  # Dokumentasi project (file ini)
```

### Penjelasan Tiap File

| File | Penjelasan |
|------|------------|
| `auth.proto` | File "kontrak" yang mendefinisikan layanan apa saja yang tersedia (Register, Login, Logout) beserta format data yang dikirim dan diterima. File ini ditulis dalam bahasa Protocol Buffers, lalu di-compile menjadi kode Python. |
| `auth_pb2.py` | File hasil compile otomatis dari `auth.proto`. Berisi class Python untuk setiap struktur data (contoh: `RegisterRequest`, `LoginResponse`). **Jangan edit file ini secara manual.** |
| `auth_pb2_grpc.py` | File hasil compile otomatis dari `auth.proto`. Berisi class Python untuk layanan gRPC (contoh: `AuthServiceStub`, `AuthServiceServicer`). **Jangan edit file ini secara manual.** |
| `auth_server.py` | File utama yang menjalankan gRPC server. Di sinilah logika Register, Login, dan Logout diimplementasikan. Server berjalan di port `50051`. |
| `database.py` | Modul yang menangani semua operasi database: menyimpan user baru, memverifikasi password, dan mengelola token sesi. Terhubung ke Supabase menggunakan API key. |
| `test_client.py` | Script untuk menguji semua fitur secara otomatis. Menjalankan 6 skenario test (register berhasil, register duplikat, login benar, login salah, logout berhasil, logout token expired). |
| `.env` | Menyimpan URL dan API key Supabase. File ini **tidak boleh di-upload ke GitHub** karena berisi data rahasia. |
| `requirements.txt` | Daftar semua library Python yang dibutuhkan beserta versinya. Digunakan untuk instalasi cepat di komputer lain. |

---

## ⚡ Cara Setup & Menjalankan Project

### Prasyarat

- Python 3.10 atau lebih baru sudah terinstall
- Akun Supabase dengan tabel `users` yang sudah dibuat
- Tabel `users` memiliki kolom: `id`, `name`, `email`, `password`, `created_at`, `updated_at`

### Langkah 1: Install Dependencies

Buka terminal di folder project, lalu jalankan:

```bash
pip install -r requirements.txt
```

Perintah ini akan menginstall semua library yang tercantum di `requirements.txt` secara otomatis.

### Langkah 2: Setup File `.env`

Buka file `.env` dan isi dengan data Supabase kamu:

```env
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

**Cara mendapatkan URL dan API Key:**

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project kamu
3. Klik **Settings** (ikon gear ⚙️) di sidebar kiri
4. Klik **API**
5. Salin **Project URL** → paste ke `SUPABASE_URL`
6. Salin **anon / public key** → paste ke `SUPABASE_KEY`

> ⚠️ **Penting:** Format URL harus `https://xxx.supabase.co`, **bukan** `https://supabase.com/dashboard/project/xxx`. Yang pertama adalah URL API, yang kedua adalah URL dashboard browser.

### Langkah 3: Compile File Proto (Opsional)

Langkah ini hanya perlu dilakukan jika kamu mengubah file `auth.proto`. File hasil compile sudah disertakan di folder `generated/`.

```bash
python -m grpc_tools.protoc -I./protos --python_out=./generated --grpc_python_out=./generated ./protos/auth.proto
```

### Langkah 4: Jalankan Server

```bash
python auth_server.py
```

Jika berhasil, akan muncul output:

```
==================================================
AUTH gRPC SERVER BERJALAN!
Mendengarkan di port: 50051
Tekan Ctrl+C untuk menghentikan server
==================================================
```

Server akan terus berjalan sampai kamu menekan `Ctrl+C`.

### Langkah 5: Jalankan Test Client (Opsional)

Buka terminal **baru** (jangan tutup terminal server), lalu jalankan:

```bash
python test_client.py
```

---

## 📡 Daftar Endpoint gRPC

Semua endpoint didefinisikan di dalam service `AuthService` pada file `protos/auth.proto`. Server berjalan di `localhost:50051`.

---

### 1. Register — Mendaftarkan User Baru

Mendaftarkan pengguna baru ke dalam database. Email harus unik (belum pernah dipakai). Password akan dienkripsi (hash) sebelum disimpan.

**Request (`RegisterRequest`):**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `name` | `string` | Nama lengkap pengguna |
| `email` | `string` | Alamat email (harus unik) |
| `password` | `string` | Password pengguna |

**Response (`RegisterResponse`):**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `success` | `bool` | `true` jika registrasi berhasil |
| `message` | `string` | Pesan hasil operasi |

**Contoh penggunaan di Python:**

```python
response = stub.Register(
    auth_pb2.RegisterRequest(
        name="Andi Pratama",
        email="andi@example.com",
        password="rahasia123"
    )
)
print(response.success)  # True
print(response.message)  # "Registrasi berhasil! Silakan login."
```

---

### 2. Login — Masuk ke Akun

Memverifikasi email dan password pengguna. Jika berhasil, server akan mengirimkan token sesi yang bisa digunakan untuk autentikasi selanjutnya.

**Request (`LoginRequest`):**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `email` | `string` | Alamat email pengguna |
| `password` | `string` | Password pengguna |

**Response (`LoginResponse`):**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `success` | `bool` | `true` jika login berhasil |
| `message` | `string` | Pesan hasil operasi |
| `token` | `string` | Token sesi (UUID) untuk autentikasi. Kosong jika gagal. |

**Contoh penggunaan di Python:**

```python
response = stub.Login(
    auth_pb2.LoginRequest(
        email="andi@example.com",
        password="rahasia123"
    )
)
print(response.success)  # True
print(response.message)  # "Login berhasil! Selamat datang, Andi Pratama."
print(response.token)    # "0dbca83a-badc-4103-aa64-bbe20159348a"
```

---

### 3. Logout — Keluar dari Akun

Menghapus token sesi yang aktif. Setelah logout, token tersebut tidak bisa digunakan lagi.

**Request (`LogoutRequest`):**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `token` | `string` | Token sesi yang ingin di-logout |

**Response (`LogoutResponse`):**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `success` | `bool` | `true` jika logout berhasil |
| `message` | `string` | Pesan hasil operasi |

**Contoh penggunaan di Python:**

```python
response = stub.Logout(
    auth_pb2.LogoutRequest(
        token="0dbca83a-badc-4103-aa64-bbe20159348a"
    )
)
print(response.success)  # True
print(response.message)  # "Logout berhasil. Sampai jumpa, Andi Pratama!"
```

---

## 🖥️ Contoh Output Terminal

### Output Server (`auth_server.py`)

Saat ada request masuk, server akan menampilkan log di terminal:

```
==================================================
AUTH gRPC SERVER BERJALAN!
Mendengarkan di port: 50051
Tekan Ctrl+C untuk menghentikan server
==================================================

[REGISTER] Request diterima:
   Nama : Andi Pratama
   Email: andi@example.com
   Hasil: BERHASIL - Registrasi berhasil! Silakan login.

[LOGIN] Request diterima:
   Email: andi@example.com
   Hasil: BERHASIL - Login berhasil! Selamat datang, Andi Pratama.
   Token: 0dbca83a-badc-4103-aa64-bbe20159348a

[LOGOUT] Request diterima:
   Token: 0dbca83a-badc-4103-aa64-bbe20159348a
   Hasil: BERHASIL - Logout berhasil. Sampai jumpa, Andi Pratama!
```

### Output Test Client (`test_client.py`)

```
########################################
#   TEST CLIENT - AUTH gRPC SERVICE    #
########################################

==================================================
TEST REGISTER
==================================================
  Nama    : Andi Pratama
  Email   : andi@example.com
  Password: rahasia123
--------------------------------------------------
  Success : True
  Message : Registrasi berhasil! Silakan login.

==================================================
TEST REGISTER
==================================================
  Nama    : Andi Pratama
  Email   : andi@example.com
  Password: rahasia123
--------------------------------------------------
  Success : False
  Message : Email sudah terdaftar. Silakan gunakan email lain.

==================================================
TEST LOGIN
==================================================
  Email   : andi@example.com
  Password: rahasia123
--------------------------------------------------
  Success : True
  Message : Login berhasil! Selamat datang, Andi Pratama.
  Token   : 0dbca83a-badc-4103-aa64-bbe20159348a

==================================================
TEST LOGIN
==================================================
  Email   : andi@example.com
  Password: passwordsalah
--------------------------------------------------
  Success : False
  Message : Password salah. Silakan coba lagi.

==================================================
TEST LOGOUT
==================================================
  Token   : 0dbca83a-badc-4103-aa64-bbe20159348a
--------------------------------------------------
  Success : True
  Message : Logout berhasil. Sampai jumpa, Andi Pratama!

==================================================
TEST LOGOUT
==================================================
  Token   : 0dbca83a-badc-4103-aa64-bbe20159348a
--------------------------------------------------
  Success : False
  Message : Token tidak valid atau sudah expired.

########################################
#        SEMUA TEST SELESAI!           #
########################################
```

---

## 🛡️ Error Handling

Layanan ini menangani beberapa skenario error yang umum terjadi:

### 1. Email Sudah Terdaftar (Register)

Jika pengguna mencoba mendaftar dengan email yang sudah ada di database, server akan menolak dan mengirimkan pesan error.

| Field | Nilai |
|-------|-------|
| `success` | `False` |
| `message` | `"Email sudah terdaftar. Silakan gunakan email lain."` |

**Mengapa ini penting?**
Setiap pengguna harus memiliki email unik supaya tidak terjadi konflik data saat login.

---

### 2. Email Tidak Ditemukan (Login)

Jika pengguna mencoba login dengan email yang belum terdaftar di database.

| Field | Nilai |
|-------|-------|
| `success` | `False` |
| `message` | `"Email tidak ditemukan. Silakan register terlebih dahulu."` |

---

### 3. Password Salah (Login)

Jika email ditemukan tetapi password yang dimasukkan tidak cocok dengan yang tersimpan di database.

| Field | Nilai |
|-------|-------|
| `success` | `False` |
| `message` | `"Password salah. Silakan coba lagi."` |

**Catatan keamanan:** Server tidak memberitahu secara spesifik apakah yang salah itu email atau password. Ini adalah praktik keamanan standar untuk mencegah penyerang menebak akun mana yang terdaftar. Namun pada versi ini, pesan error dipisahkan untuk mempermudah debugging selama tahap pengembangan.

---

### 4. Token Tidak Valid atau Sudah Expired (Logout)

Jika pengguna mencoba logout dengan token yang tidak ada di daftar sesi aktif (misalnya sudah logout sebelumnya atau token salah).

| Field | Nilai |
|-------|-------|
| `success` | `False` |
| `message` | `"Token tidak valid atau sudah expired."` |

---

### 5. Error Tidak Terduga

Jika terjadi error yang tidak terduga (misalnya koneksi database terputus), server akan menangkap error tersebut dan mengirimkan pesan umum.

| Field | Nilai |
|-------|-------|
| `success` | `False` |
| `message` | `"Terjadi kesalahan: [detail error]"` |

---

## 📝 Catatan Tambahan

- **Token sesi** disimpan di memori server (RAM). Artinya, semua token akan hilang jika server di-restart. Untuk aplikasi production, token sebaiknya disimpan di database.
- **Password** tidak pernah disimpan dalam bentuk asli. Yang tersimpan di database adalah hasil hash menggunakan algoritma bcrypt, sehingga tidak bisa dibaca meskipun database diretas.
- **Port 50051** adalah port standar untuk gRPC. Pastikan port ini tidak digunakan oleh aplikasi lain saat menjalankan server.

---

## 👨‍💻 Dibuat Oleh

**Dev3** — SP7: Fitur Login & Registrasi

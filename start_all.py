import subprocess
import sys
import os
import time
import signal

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

processes = []

services = [
    {
        "name": "gRPC Server (50051)",
        "cmd": [sys.executable, "auth_server.py"],
        "cwd": BASE_DIR,
    },
    {
        "name": "Auth REST API (8000)",
        "cmd": [sys.executable, "rest_api.py"],
        "cwd": BASE_DIR,
    },
    {
        "name": "CoachBot API (8001)",
        "cmd": [sys.executable, "rest_api.py"],
        "cwd": os.path.join(BASE_DIR, "jimamet_coachbot"),
    },
    {
        "name": "React Frontend (5173)",
        "cmd": ["npm", "run", "dev"],
        "cwd": os.path.join(BASE_DIR, "frontend"),
    },
]


def start_all():
    print("=" * 50)
    print("MENJALANKAN SEMUA SERVICE")
    print("=" * 50)

    for svc in services:
        proc = subprocess.Popen(
            svc["cmd"],
            cwd=svc["cwd"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            shell=True,
        )
        processes.append(proc)
        print(f"  [OK] {svc['name']}")

    time.sleep(2)

    print("=" * 50)
    print("SEMUA SERVICE BERJALAN!")
    print("")
    print("  Auth gRPC  : localhost:50051")
    print("  Auth API   : http://localhost:8000")
    print("  CoachBot   : http://localhost:8001")
    print("  Frontend   : http://localhost:5173")
    print("")
    print("Tekan Ctrl+C untuk menghentikan semua")
    print("=" * 50)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nMenghentikan semua service...")
        for proc in processes:
            proc.terminate()
        for proc in processes:
            proc.wait()
        print("Semua service dihentikan.")


if __name__ == "__main__":
    start_all()

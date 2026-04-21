import sys
import os
import grpc
from concurrent import futures

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "generated"))

import auth_pb2
import auth_pb2_grpc

from database import create_user, authenticate_user, remove_token


class AuthServiceServicer(auth_pb2_grpc.AuthServiceServicer):

    def Register(self, request, context):
        print(f"\n[REGISTER] Request diterima:")
        print(f"   Nama : {request.name}")
        print(f"   Email: {request.email}")

        result = create_user(
            name=request.name,
            email=request.email,
            password=request.password
        )

        status = "BERHASIL" if result["success"] else "GAGAL"
        print(f"   Hasil: {status} - {result['message']}")

        return auth_pb2.RegisterResponse(
            success=result["success"],
            message=result["message"]
        )

    def Login(self, request, context):
        print(f"\n[LOGIN] Request diterima:")
        print(f"   Email: {request.email}")

        result = authenticate_user(
            email=request.email,
            password=request.password
        )

        status = "BERHASIL" if result["success"] else "GAGAL"
        print(f"   Hasil: {status} - {result['message']}")
        if result["success"]:
            print(f"   Token: {result['token']}")

        return auth_pb2.LoginResponse(
            success=result["success"],
            message=result["message"],
            token=result["token"]
        )

    def Logout(self, request, context):
        print(f"\n[LOGOUT] Request diterima:")
        print(f"   Token: {request.token}")

        result = remove_token(token=request.token)

        status = "BERHASIL" if result["success"] else "GAGAL"
        print(f"   Hasil: {status} - {result['message']}")

        return auth_pb2.LogoutResponse(
            success=result["success"],
            message=result["message"]
        )


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    auth_pb2_grpc.add_AuthServiceServicer_to_server(
        AuthServiceServicer(), server
    )

    port = "50051"
    server.add_insecure_port(f"[::]:{port}")

    server.start()

    print("=" * 50)
    print("AUTH gRPC SERVER BERJALAN!")
    print(f"Mendengarkan di port: {port}")
    print("Tekan Ctrl+C untuk menghentikan server")
    print("=" * 50)

    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        print("\n\nServer dihentikan oleh user.")
        server.stop(0)


if __name__ == "__main__":
    serve()

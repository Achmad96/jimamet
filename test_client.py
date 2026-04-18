import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "generated"))

import grpc
import auth_pb2
import auth_pb2_grpc


def test_register(stub, name, email, password):
    print("=" * 50)
    print("TEST REGISTER")
    print("=" * 50)
    print(f"  Nama    : {name}")
    print(f"  Email   : {email}")
    print(f"  Password: {password}")
    print("-" * 50)

    response = stub.Register(
        auth_pb2.RegisterRequest(
            name=name,
            email=email,
            password=password
        )
    )

    print(f"  Success : {response.success}")
    print(f"  Message : {response.message}")
    print()

    return response


def test_login(stub, email, password):
    print("=" * 50)
    print("TEST LOGIN")
    print("=" * 50)
    print(f"  Email   : {email}")
    print(f"  Password: {password}")
    print("-" * 50)

    response = stub.Login(
        auth_pb2.LoginRequest(
            email=email,
            password=password
        )
    )

    print(f"  Success : {response.success}")
    print(f"  Message : {response.message}")
    if response.token:
        print(f"  Token   : {response.token}")
    print()

    return response


def test_logout(stub, token):
    print("=" * 50)
    print("TEST LOGOUT")
    print("=" * 50)
    print(f"  Token   : {token}")
    print("-" * 50)

    response = stub.Logout(
        auth_pb2.LogoutRequest(
            token=token
        )
    )

    print(f"  Success : {response.success}")
    print(f"  Message : {response.message}")
    print()

    return response


def main():
    channel = grpc.insecure_channel("localhost:50051")
    stub = auth_pb2_grpc.AuthServiceStub(channel)

    print()
    print("########################################")
    print("#   TEST CLIENT - AUTH gRPC SERVICE    #")
    print("########################################")
    print()

    nama = "Andi Pratama"
    email = "andi@example.com"
    password = "rahasia123"

    test_register(stub, nama, email, password)

    test_register(stub, nama, email, password)

    login_response = test_login(stub, email, password)

    test_login(stub, email, "passwordsalah")

    if login_response.token:
        test_logout(stub, login_response.token)

        test_logout(stub, login_response.token)

    channel.close()

    print("########################################")
    print("#        SEMUA TEST SELESAI!           #")
    print("########################################")


if __name__ == "__main__":
    main()

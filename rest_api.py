import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "generated"))

import grpc
import auth_pb2
import auth_pb2_grpc

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GRPC_SERVER = "localhost:50051"


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class LogoutRequest(BaseModel):
    token: str


def get_grpc_stub():
    channel = grpc.insecure_channel(GRPC_SERVER)
    return auth_pb2_grpc.AuthServiceStub(channel)


@app.post("/api/register")
def register(request: RegisterRequest):
    stub = get_grpc_stub()

    response = stub.Register(
        auth_pb2.RegisterRequest(
            name=request.name,
            email=request.email,
            password=request.password
        )
    )

    return {
        "success": response.success,
        "message": response.message
    }


@app.post("/api/login")
def login(request: LoginRequest):
    stub = get_grpc_stub()

    response = stub.Login(
        auth_pb2.LoginRequest(
            email=request.email,
            password=request.password
        )
    )

    return {
        "success": response.success,
        "message": response.message,
        "token": response.token
    }


@app.post("/api/logout")
def logout(request: LogoutRequest):
    stub = get_grpc_stub()

    response = stub.Logout(
        auth_pb2.LogoutRequest(
            token=request.token
        )
    )

    return {
        "success": response.success,
        "message": response.message
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

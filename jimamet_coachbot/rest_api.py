from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from coachbot_service import chat, analyze_food, get_nutrition_recommendation

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None


class FoodAnalyzeRequest(BaseModel):
    image_base64: str


class RecommendRequest(BaseModel):
    user_id: str


@app.post("/api/chat")
def api_chat(request: ChatRequest):
    try:
        reply = chat(request.message, request.user_id)
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"Maaf, terjadi kesalahan: {str(e)}"}


@app.post("/api/analyze-food")
def api_analyze_food(request: FoodAnalyzeRequest):
    try:
        result = analyze_food(request.image_base64)
        return result
    except Exception as e:
        return {
            "description": "Gagal menganalisis gambar",
            "calories": "0",
            "nutrients": {
                "karbohidrat": "0",
                "protein": "0",
                "lemak": "0",
                "serat": "0"
            },
            "saran": f"Terjadi kesalahan: {str(e)}"
        }


@app.post("/api/recommendation")
def api_recommendation(request: RecommendRequest):
    try:
        result = get_nutrition_recommendation(request.user_id)
        return {"recommendation": result}
    except Exception as e:
        return {"recommendation": f"Maaf, terjadi kesalahan: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

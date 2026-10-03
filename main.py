import os
import secrets

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
import joblib

# Local la .env read pannum, Render la env variables direct-aa varum
load_dotenv()
AI_API_KEY = os.getenv("AI_API_KEY")

app = FastAPI()

# Trained model load
model = joblib.load("spam_model.pkl")

# Backend "X-API-Key" header la key anuppanum
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_api_key(key: str = Depends(api_key_header)):
    # Key set pannalaatti ellaa request-um block
    if not AI_API_KEY or not key or not secrets.compare_digest(key, AI_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

# Input format
class Message(BaseModel):
    text: str

@app.get("/")
def home():
    return {"status": "Spam Detector API running"}

@app.post("/predict", dependencies=[Depends(verify_api_key)])
def predict(msg: Message):
    result = model.predict([msg.text])[0]
    return {"text": msg.text, "prediction": result}

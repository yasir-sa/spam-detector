from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib

app = FastAPI()

# Frontend (React) la irundhu call panna allow pannudhu
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trained model load
model = joblib.load("spam_model.pkl")

# Input format
class Message(BaseModel):
    text: str

@app.get("/")
def home():
    return {"status": "Spam Detector API running"}

@app.post("/predict")
def predict(msg: Message):
    result = model.predict([msg.text])[0]
    return {"text": msg.text, "prediction": result}

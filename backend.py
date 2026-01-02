# backend.py
from fastapi import FastAPI
from pydantic import BaseModel
import os
from openai import OpenAI

app = FastAPI()

os.environ['HF_TOKEN'] = "token"

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=os.environ["HF_TOKEN"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    completion = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": req.message}],
    )
    return {"response": completion.choices[0].message.content}

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from vector import retriever
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = OllamaLLM(model="llama3.2")

template = """
You are assigned to monitor the conversations of a consenting study group and assess whether those
conversations are off topic or not.

Here is relevant assignment or lesson information: {reviews}

Here are their conversations: {question}

Provide a clear and concise rating of how on task they are from 0 - 100. Only say the rating.
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

class Convo(BaseModel):
    text: str

@app.post("/rate-conversation")
async def rate_conversation(request: Convo):
    conversation_text = request.text
    
    docs = retriever.invoke(conversation_text)
    reviews = "\n\n".join([doc.page_content for doc in docs])
    rating = chain.invoke({"reviews": reviews, "question": conversation_text})
    
    return {"rating": rating.strip()}


# @app.websocket("/ws/conversation")
# async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive audio or text from frontend
            data = await websocket.receive_json()
            conversation_text = data.get("text")
            
            # Get relevant documents
            docs = retriever.invoke(conversation_text)
            reviews = "\n\n".join([doc.page_content for doc in docs])
            
            # Get rating from LLM
            rating = chain.invoke({"reviews": reviews, "question": conversation_text})
            
            # Send rating back
            await websocket.send_json({"rating": rating.strip()})
    except Exception as e:
        await websocket.send_json({"error": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
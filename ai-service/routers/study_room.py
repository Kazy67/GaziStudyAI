import os
from fastapi import APIRouter
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

router = APIRouter(prefix="/ai", tags=["Study Room Chat"])

class ChatRequest(BaseModel):
    course_prefix: str
    weeks: list[int] # C# sends ALL uploaded weeks automatically
    message: str

@router.post("/chat")
async def study_room_chat(request: ChatRequest):
    try:
        # 1. Format the tags to search in ChromaDB (e.g., ["na_hafta_1", "na_hafta_2"])
        target_weeks = [f"{request.course_prefix.lower()}_hafta_{w}" for w in request.weeks]
        
        # 2. Connect to ChromaDB
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = Chroma(persist_directory="./vector_db", embedding_function=embeddings)
        
        # 3. Search ONLY the uploaded PDFs for this specific course
        # k=5 gives it a good amount of context without overloading the token limit
        docs = db.similarity_search(
            query=request.message, 
            k=5, 
            filter={"week": {"$in": target_weeks}}
        )
        
        # Combine the found text chunks into one context string
        context = "\n\n".join([doc.page_content for doc in docs]) if docs else "No specific course materials found for this topic."

        # 4. Initialize Gemini (Low temperature for factual, academic responses)
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.2 
        )
        
        # 5. The Advanced English RAG Prompt
        prompt = f"""
        You are 'GaziStudyAI', an expert academic assistant helping university students.
        
        STUDENT'S QUESTION: 
        {request.message}
        
        COURSE MATERIALS (CONTEXT):
        {context}
        
        CRITICAL RULES:
        1. You MUST answer the student's question using ONLY the provided COURSE MATERIALS.
        2. If the answer cannot be found in the COURSE MATERIALS, you must state: "Bu bilgi mevcut ders materyallerinde bulunmuyor, ancak genel bilgime göre..." (This information is not in the materials, but based on my general knowledge...), and then provide a helpful answer.
        3. OUTPUT LANGUAGE: Your entire response MUST be written in academic, friendly, and easy-to-read TURKISH.
        4. FORMATTING: Use Markdown extensively. Use bolding for key terms, bullet points for lists, and write mathematical formulas using LaTeX (single $ for inline, double $$ for block equations).
        5. Tone: Be encouraging and act as a mentor.
        """
        
        response = await llm.ainvoke(prompt)
        
        return {"success": True, "data": {"reply": response.content}}

    except Exception as e:
        return {"success": False, "error": str(e)}
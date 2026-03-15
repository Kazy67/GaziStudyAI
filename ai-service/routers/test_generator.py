import os
import json
import random
from fastapi import APIRouter
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

router = APIRouter(prefix="/ai", tags=["Test Generator"])

class ExamRequest(BaseModel):
    course_prefix: str  # e.g., "os" or "vp"
    weeks: list[int]    # e.g., [1, 2, 3]
    question_count: int # e.g., 10
    difficulty: str     # "Kolay", "Orta", or "Zor"

@router.post("/generate-test")
async def generate_exam(request: ExamRequest):
    try:
        # 1. Map frontend numbers to DB tags (e.g., "os_hafta_1" or "vp_hafta_1")
        target_weeks = [f"{request.course_prefix.lower()}_hafta_{w}" for w in request.weeks]
        
        # 2. Retrieve Documents
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = Chroma(persist_directory="./vector_db", embedding_function=embeddings)
        
        docs = db.get(where={"week": {"$in": target_weeks}})
        if not docs["documents"]:
            return {"success": False, "error": f"Veritabanında bu haftalar için veri bulunamadı: {target_weeks}"}
        
        context = "\n".join(docs["documents"])

        # 3. Initialize Gemini
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.7 
        )
        
        # 4. THE SMART PROMPT (Difficulty Integrated)
        prompt = f"""
        You are an expert University Professor in Computer Science.
        Analyze the Turkish lecture notes provided below and generate {request.question_count} multiple-choice questions.

        PARAMETERS:
        - Output Language: STRICTLY TURKISH (Soru ve şıklar tamamen Türkçe olmalıdır).
        - Difficulty Level: {request.difficulty.upper()}
           * EASY: Ask basic definitions, terminology, and direct facts from the text.
           * MEDIUM: Ask about concepts, differences between models, and how specific algorithms/machines work.
           * HARD: Ask analytical questions, scenario-based problems, or require the student to trace a process (e.g., state transitions, code execution).

        LECTURE NOTES:
        {context[:30000]}

        RULES:
        1. All text (questions, correct answers, wrong answers) MUST be in natural, academic Turkish.
        2. Focus strictly on the technical content in the notes. Do not hallucinate outside information.
        3. Provide exactly 1 'correct_answer' and exactly 3 'distractors' (wrong answers) that are plausible but incorrect.
        4. Output ONLY raw JSON. Do NOT wrap the JSON in markdown formatting like ```json. Just return the array.

        REQUIRED JSON FORMAT:
        [
          {{
            "question": "Türkçe soru metni...",
            "correct_answer": "Doğru cevap metni",
            "distractors": ["Yanlış cevap 1", "Yanlış cevap 2", "Yanlış cevap 3"]
          }}
        ]
        """
        
        response = await llm.ainvoke(prompt)
        
        # 5. Clean and Parse JSON
        content = response.content.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
             content = content.replace("```", "").strip()

        raw_quiz_data = json.loads(content)
        
        # 6. Shuffle Options
        final_quiz_data = []
        letters = ["A", "B", "C", "D"]

        for q in raw_quiz_data:
            all_options = [q["correct_answer"]] + q["distractors"]
            random.shuffle(all_options)
            
            formatted_options = []
            final_answer = ""
            
            for i, opt in enumerate(all_options):
                letter_opt = f"{letters[i]}) {opt}"
                formatted_options.append(letter_opt)
                if opt == q["correct_answer"]:
                    final_answer = letter_opt

            final_quiz_data.append({
                "question": q["question"],
                "options": formatted_options,
                "answer": final_answer
            })

        return {"success": True, "data": final_quiz_data}

    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "error": str(e)}
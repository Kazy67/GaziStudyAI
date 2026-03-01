import os
import json
import random
from fastapi import APIRouter
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

router = APIRouter(prefix="/ai", tags=["Exam Generator"])

class ClassicRequest(BaseModel):
    course_prefix: str
    weeks: list[int]
    question_count: int
    difficulty: str

# ==========================================
# 2. COURSE CONFIGURATIONS (Updated for W1-W12)
# ==========================================
OS_CLASSIC_TOPICS = {
    1: ["generic_theory"],
    2: ["generic_theory"],
    3: ["generic_theory"],
    4: ["generic_theory"],
    5: ["cpu_scheduling_fcfs", "cpu_scheduling_sjf", "cpu_scheduling_srtf", "cpu_scheduling_rr", "cpu_scheduling_priority", "cpu_scheduling_hrrn"],
    6: ["cpu_scheduling_multilevel", "cpu_scheduling_multilevel_feedback"],
    7: ["generic_theory"], # Synchronization
    8: ["generic_theory"], # Synchronization Problems
    9: ["deadlock_bankers"],
    10: ["memory_allocation_first", "memory_allocation_next", "memory_allocation_best"],
    11: ["generic_theory"], # Segmentation
    12: ["page_replacement_fifo", "page_replacement_lru", "page_replacement_optimal"]
}

FALLBACK_CONTEXTS = {
    "os": "Genel İşletim Sistemleri Kuralları ve Tanımları.",
    "vp": "Genel Görsel Programlama (.NET, C#) Kuralları."
}

# ==========================================
# 3. HELPER FUNCTIONS
# ==========================================
def clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"): text = text.replace("```json", "", 1)
    if text.startswith("```"): text = text.replace("```", "", 1)
    if text.endswith("```"): text = text[::-1].replace("```", "", 1)[::-1]
    return text.strip()

def get_difficulty_rules(difficulty: str, topic_type: str) -> str:
    diff = difficulty.lower()
    if "cpu" in topic_type:
        if diff == "easy": return "Use exactly 3 processes."
        if diff == "medium": return "Use exactly 4 processes."
        if diff == "hard": return "Use exactly 5 processes. Include Arrival Times."
    elif "page" in topic_type:
        if diff == "easy": return "Use 3 Frames. Reference string length exactly 8."
        if diff == "medium": return "Use 3 Frames. Reference string length exactly 12."
        if diff == "hard": return "Use 4 Frames. Reference string length exactly 15."
    elif "deadlock" in topic_type:
        if diff == "easy": return "Use 3 Processes and 3 Resource Types."
        if diff == "medium": return "Use 4 Processes and 3 Resource Types."
        if diff == "hard": return "Use 5 Processes and 4 Resource Types."
    elif "memory" in topic_type:
        if diff == "easy": return "Use 4 Memory Partitions and 3 Processes."
        if diff == "medium": return "Use 5 Memory Partitions and 4 Processes."
        if diff == "hard": return "Use 6 Memory Partitions and 5 Processes."
    return "Keep it standard university level."

def build_classic_prompt(prefix: str, topic: str, diff_rules: str, context: str, seed: int) -> str:
    # Notice we added 'seed' to force uniqueness!
    base_prompt = f"""
    You are an automated exam generator. Create ONE '{topic}' problem in TURKISH.
    CONTEXT: {context[:4000]}
    DIFFICULTY RULES: {diff_rules}
    VARIANT SEED: {seed} (Use this random seed to pick a unique sub-topic or numbers so questions don't duplicate).
    
    CRITICAL INSTRUCTION:
    DO NOT WRITE ANY INTRODUCTORY TEXT.
    Output ONLY valid JSON.
    """

    if prefix == "os":
        if "cpu_scheduling" in topic:
            algo_key = topic.replace("cpu_scheduling_", "").upper()
            return base_prompt + f"""
            CRITICAL: YOU MUST USE THE EXACT "questionText" STRING PROVIDED IN THE TEMPLATE BELOW. DO NOT CHANGE IT.
            {{
                "visualType": "{topic}",
                "questionText": "Aşağıdaki prosesler belirtilen zamanlarda sisteme gelmiştir. {algo_key} algoritmasını kullanarak her bir proses için Dönüş Süresini (Turnaround Time) ve Bekleme Süresini (Waiting Time) hesaplayınız. Ortalama değerleri virgülden sonra 2 hane olacak şekilde yazınız.",
                "inputData": {{
                    "headers": ["Process", "Arrival Time", "Burst Time"],
                    "rows": [["P1", 0, 5], ["P2", 1, 3], ["P3", 2, 8]]
                }},
                "solutionData": {{
                    "processMetrics": [
                        {{"process": "P1", "turnaroundTime": 5, "waitingTime": 0}}
                    ],
                    "averageTurnaroundTime": 8.67,
                    "averageWaitingTime": 3.33
                }}
            }}
            """
        
        elif "page_replacement" in topic:
            algo = topic.split("_")[2].upper()
            return base_prompt + f"""
            CRITICAL: YOU MUST USE THE EXACT "questionText" STRING PROVIDED IN THE TEMPLATE BELOW. DO NOT CHANGE IT.
            {{
                "visualType": "{topic}",
                "questionText": "Aşağıdaki referans dizisi için {algo} algoritmasını kullanarak bellek çerçevelerinin (frames) durumunu adım adım gösteriniz ve Toplam Sayfa Hatası (Page Fault) sayısını bulunuz. (Çerçeve Sayısı = 3)",
                "inputData": {{
                    "frames": 3,
                    "referenceString": [7, 0, 1, 2, 0, 3]
                }},
                "solutionData": {{
                    "steps": [
                        {{"step": 1, "page": 7, "frames": [7, null, null], "status": "MISS"}},
                        {{"step": 2, "page": 0, "frames": [7, 0, null], "status": "MISS"}},
                        {{"step": 3, "page": 1, "frames": [7, 0, 1], "status": "MISS"}},
                        {{"step": 4, "page": 2, "frames": [2, 0, 1], "status": "MISS"}},
                        {{"step": 5, "page": 0, "frames": [2, 0, 1], "status": "HIT"}}
                    ],
                    "totalPageFaults": 4
                }}
            }}
            
            CRITICAL: You MUST output the 'steps' array inside 'solutionData'. You MUST calculate the frame state for EVERY SINGLE number in the reference string before calculating 'totalPageFaults'. Do not skip any steps.
            """
            
        elif "deadlock_bankers" in topic:
            return base_prompt + """
            CRITICAL: YOU MUST USE THE EXACT "questionText" STRING PROVIDED IN THE TEMPLATE BELOW. DO NOT CHANGE IT.
            {
                "visualType": "deadlock_bankers",
                "questionText": "Aşağıdaki sistem için Banker Algoritmasını kullanarak sistemin Güvenli (Safe) olup olmadığını belirleyiniz. Eğer güvenliyse, Güvenli Sırayı (Safe Sequence) yazınız.",
                "inputData": {
                    "resources": ["A", "B", "C"],
                    "available": [3, 3, 2],
                    "processes": [
                        {"id": "P0", "allocation": [0, 1, 0], "max": [7, 5, 3]},
                        {"id": "P1", "allocation": [2, 0, 0], "max": [3, 2, 2]}
                    ]
                },
                "solutionData": {
                    "isSafe": true,
                    "safeSequence": ["P1", "P0"]
                }
            }
            """
            
        elif "memory_allocation" in topic:
            algo = topic.split("_")[2].upper()
            return base_prompt + f"""
            CRITICAL: YOU MUST USE THE EXACT "questionText" STRING PROVIDED IN THE TEMPLATE BELOW. DO NOT CHANGE IT.
            {{
                "visualType": "{topic}",
                "questionText": "Aşağıdaki bellek bölümlerine (partitions) ve proses boyutlarına göre {algo}-FIT bellek tahsis algoritmasını uygulayınız. Her prosesin hangi belleğe yerleştiğini bulunuz.",
                "inputData": {{
                    "partitions": [
                        {{"id": "B1", "size": 100}},
                        {{"id": "B2", "size": 500}},
                        {{"id": "B3", "size": 200}}
                    ],
                    "processes": [
                        {{"id": "P1", "size": 212}},
                        {{"id": "P2", "size": 417}}
                    ]
                }},
                "solutionData": {{
                    "allocations": [
                        {{"processId": "P1", "partitionId": "B2"}},
                        {{"processId": "P2", "partitionId": null}} 
                    ]
                }}
            }}
            """
            
    # --- FALLBACK / THEORY FOR ANY COURSE ---
    return base_prompt + """
    {
        "visualType": "generic_theory",
        "questionText": "[LÜTFEN BURAYA CONTEXT İÇERİSİNDEN YENİ VE BENZERSİZ BİR TEORİK SORU YAZINIZ]",
        "inputData": {},
        "solutionData": {
            "keywordsRequired": ["kelime1", "kelime2", "kelime3"]
        }
    }
    
    CRITICAL INSTRUCTION FOR generic_theory: 
    1. Read the provided CONTEXT. Look at the VARIANT SEED to pick a specific, unique sub-topic.
    2. Write a REAL theoretical essay question in 'questionText' replacing the placeholder.
    3. Determine the answer, and extract 3 to 5 critical keywords that a student MUST include in their answer to get full points. List them in 'keywordsRequired' (lowercase, single words only).
    """

# ==========================================
# 4. THE MAIN API ENDPOINT
# ==========================================
@router.post("/generate-classic")
async def generate_classic_exam(request: ClassicRequest):
    try:
        prefix = request.course_prefix.lower()
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.1 
        )

        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = Chroma(persist_directory="./vector_db", embedding_function=embeddings)
        
        target_weeks = [f"{prefix}_hafta_{w}" for w in request.weeks]
        docs = db.get(where={"week": {"$in": target_weeks}})
        
        fallback = FALLBACK_CONTEXTS.get(prefix, "Genel Kurallar")
        context = "\n".join(docs["documents"]) if docs and docs["documents"] else fallback

        available_topics = []
        if prefix == "os":
            for w in request.weeks:
                if w in OS_CLASSIC_TOPICS:
                    available_topics.extend(OS_CLASSIC_TOPICS[w])
        
        if not available_topics:
            available_topics = ["generic_theory"]

        selected_topics = random.choices(available_topics, k=request.question_count)
        generated_questions = []

        # We use enumerate so 'i' becomes the unique seed
        for i, topic in enumerate(selected_topics):
            diff_rules = get_difficulty_rules(request.difficulty, topic)
            
            # Pass a random seed combined with index to guarantee uniqueness
            unique_seed = random.randint(1, 10000) + i
            prompt = build_classic_prompt(prefix, topic, diff_rules, context[:5000], unique_seed)
            
            print(f"Generating question {i+1} for topic: {topic}...") 
            response = await llm.ainvoke(prompt)
            
            try:
                clean_txt = clean_json(response.content)
                q_json = json.loads(clean_txt)
                generated_questions.append(q_json)
                print(f"Successfully generated {topic}!")
            except Exception as e:
                print(f"\n❌ === JSON PARSE ERROR FOR {topic} ===")
                print(f"Error Type: {e}")
                print(f"RAW AI OUTPUT:\n{response.content}\n======================================\n")
                continue

        if not generated_questions:
            return {"success": False, "error": "AI failed to generate valid JSON for all requested questions. Check Python terminal for raw output."}
        
        return {"success": True, "data": generated_questions}

    except Exception as e:
        return {"success": False, "error": str(e)}
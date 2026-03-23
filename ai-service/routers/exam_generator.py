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
    allow_theory: bool = True
    allow_code: bool = False
    allow_math: bool = False

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

VP_CLASSIC_TOPICS = {
    1: ["vp_code_completion", "generic_theory"],
    2: ["vp_code_completion"], # Loops, If/Else
    3: ["vp_code_completion"], # Data Types
    4: ["vp_code_completion"], # Type Casting
    5: ["vp_code_completion", "generic_theory"],
    6: ["generic_theory"], # Form Controls
    7: ["generic_theory"], # Form Properties
    8: ["vp_code_completion", "vp_sql_query"], # OOP & Intro to DB
    9: ["vp_sql_query"], # Access DB
    10: ["vp_sql_query"], # SQL Commands (Select, Update, Like, Between)
    11: ["generic_theory"] # Setup Creation
}

BDO_CLASSIC_TOPICS = {
    1: ["bdo_regex", "generic_theory"],
    2: ["bdo_dfa_builder"],
    3: ["bdo_nfa_builder", "generic_theory"], # NFA is now separated!
    4: ["generic_theory"],
    5: ["generic_theory"],
    6: ["bdo_dfa_reduction"],
    7: ["bdo_regex"],
    8: ["bdo_grammar_derivation"],
    9: ["bdo_grammar_derivation", "generic_theory"],
    10: ["bdo_pda_builder"],
    11: ["bdo_tm_trace", "generic_theory"]
}

FALLBACK_CONTEXTS = {
    "os": "Genel İşletim Sistemleri Kuralları ve Tanımları.",
    "vp": "Genel Görsel Programlama (.NET, C#) Kuralları.",
    "bdo": "Genel Biçimsel Diller ve Otomata Kuralları."
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
    
    # === NEW VP DIFFICULTY RULES ===
    elif "vp_code" in topic_type:
        if diff == "easy": return "Write a very simple C# code snippet (e.g., basic variable assignment or a simple if/else). Max 4 lines."
        if diff == "medium": return "Write an intermediate C# snippet (e.g., for/while loops, arrays, or simple methods)."
        if diff == "hard": return "Write a complex C# snippet (e.g., nested loops, Object Oriented concepts, classes, inheritance, or complex switch statements)."
    elif "vp_sql" in topic_type:
        if diff == "easy": return "Ask for a simple SELECT query with one basic WHERE condition."
        if diff == "medium": return "Ask for a query using LIKE, BETWEEN, or ORDER BY."
        if diff == "hard": return "Ask for a complex UPDATE, INSERT, or a SELECT query with multiple AND/OR conditions."

    # === NEW BDO DIFFICULTY RULES ===  
    elif "bdo_regex" in topic_type:
        if diff == "easy": return "Ask for a simple union or concatenation regex."
        if diff == "medium": return "Ask for a regex with Kleene star and specific start/end conditions."
        if diff == "hard": return "Ask for a complex regex with specific substring constraints (e.g., contains exactly two 'a's or no consecutive 'b's)."
    elif "bdo_dfa_builder" in topic_type:
        if diff == "easy": return "Generate a DFA that requires exactly 3 states."
        if diff == "medium": return "Generate a DFA that requires 4 states and at least one loop."
        if diff == "hard": return "Generate a DFA that requires 4-5 states, including a Trap (Dead) state."
    elif "bdo_nfa_builder" in topic_type:
        if diff == "easy": return "Generate an NFA using a simple lambda (λ) transition."
        if diff == "medium": return "Generate an NFA that branches into multiple paths for the same input."
        if diff == "hard": return "Generate an NFA for the union of two distinct languages using lambda transitions."
    elif "bdo_pda_trace" in topic_type:
        if diff == "easy": return "Use a simple a^n b^n language. Input string length exactly 4."
        if diff == "medium": return "Use a palindrome language with a center marker. Input string length exactly 5."
        if diff == "hard": return "Use a complex language like a^n b^2n. Input string length exactly 6."
    elif "bdo_grammar_derivation" in topic_type:
        if diff == "easy": return "Ask for a leftmost derivation with exactly 3 steps."
        if diff == "medium": return "Ask for a leftmost derivation with 4 to 5 steps."
        if diff == "hard": return "Ask for a derivation using Chomsky Normal Form (CNF) grammar with 6 or more steps."
    elif "bdo_tm_trace" in topic_type:
        if diff == "easy": return "Ask for a trace of a Turing Machine with maximum 3 steps. Only move Right (R)."
        if diff == "medium": return "Ask for a trace of a TM with 4 to 5 steps. Include changing symbols."
        if diff == "hard": return "Ask for a trace of a TM with 6+ steps involving changing directions (R and L)."

    # === GENERIC CUSTOM COURSE RULES ===
    elif "generic_math" in topic_type:
        if diff == "easy": return "Ask a single-step, fundamental calculation."
        if diff == "medium": return "Ask a multi-step calculation requiring formula application."
        if diff == "hard": return "Ask a highly advanced, complex calculation requiring deep analytical problem-solving."
    elif "generic_code" in topic_type:
        if diff == "easy": return "Ask to complete a basic variable assignment or simple loop."
        if diff == "medium": return "Ask to complete a core logic condition or function."
        if diff == "hard": return "Ask to complete a complex algorithm or optimization logic."
        
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

    elif prefix == "vp":
        if topic == "vp_code_completion":
            return base_prompt + f"""
            CRITICAL INSTRUCTION FOR vp_code_completion:
            1. Read the provided CONTEXT. Look at the VARIANT SEED ({seed}) and DIFFICULTY RULES to generate a UNIQUE C# code snippet.
            2. Output valid JSON matching the schema below.
            3. Replace ONE important piece of logic (a condition, keyword, or variable) in your code with exactly 5 underscores: "_____".
            4. Put the exact missing string in 'correctCode'.

            JSON SCHEMA TO FOLLOW:
            {{
                "visualType": "vp_code_completion",
                "questionText": "Aşağıdaki C# kod bloğunda eksik bırakılan yeri (_____) uygun şekilde doldurunuz.",
                "inputData": {{
                    "codeSnippet": "// WRITE YOUR DYNAMIC C# CODE HERE.\\n// USE \\n FOR NEWLINES.",
                    "language": "csharp"
                }},
                "solutionData": {{
                    "correctCode": "the_missing_word"
                }}
            }}
            """
            
        elif topic == "vp_sql_query":
            return base_prompt + f"""
            CRITICAL INSTRUCTION FOR vp_sql_query:
            1. Read the provided CONTEXT. Look at the VARIANT SEED ({seed}) and DIFFICULTY RULES to generate a UNIQUE database scenario.
            2. Output valid JSON matching the schema below.
            3. Create a realistic database scenario in Turkish and put the correct SQL command in 'correctQuery'.

            JSON SCHEMA TO FOLLOW:
            {{
                "visualType": "vp_sql_query",
                "questionText": "Aşağıda istenen işlemi gerçekleştirecek SQL sorgusunu yazınız.",
                "inputData": {{
                    "scenario": "WRITE YOUR DYNAMIC SCENARIO HERE."
                }},
                "solutionData": {{
                    "correctQuery": "SELECT * FROM Example"
                }}
            }}
            """
        
    # ================= BDO PROMPTS =================
    elif prefix == "bdo":
        if topic == "bdo_regex":
            return base_prompt + f"""
            CRITICAL INSTRUCTION FOR bdo_regex:
            1. Create a scenario asking the student to write the Regular Expression (Düzenli İfade) for a given language.
            
            JSON SCHEMA TO FOLLOW:
            {{
                "visualType": "bdo_regex",
                "questionText": "Alfabesi {{a, b}} olan ve [BURAYA KURALI YAZIN, Örn: 'ab' ile biten] dizgileri tanımlayan Düzenli İfadeyi (Regular Expression) yazınız.",
                "inputData": {{
                    "alphabet": ["a", "b"]
                }},
                "solutionData": {{
                    "correctRegex": "(a+b)*ab"
                }}
            }}
            """
            
        elif topic == "bdo_dfa_builder":
            return base_prompt + f"""
            CRITICAL INSTRUCTION FOR bdo_dfa_builder:
            1. Generate a valid mathematical DFA (Deterministic Finite Automata) problem.
            2. Every state MUST have exactly ONE transition for every symbol in the alphabet.
            
            JSON SCHEMA TO FOLLOW:
            {{
                "visualType": "bdo_dfa_builder",
                "questionText": "Alfabesi {{0, 1}} olan ve [BURAYA KURALI YAZIN, Örn: içinde '11' geçen] dizgileri kabul eden DFA'yı tasarlayınız.",
                "inputData": {{
                    "alphabet": ["0", "1"]
                }},
                "solutionData": {{
                    "states": ["q0", "q1", "q2"],
                    "startState": "q0",
                    "acceptStates": ["q2"],
                    "transitions": [
                        {{"from": "q0", "input": "0", "to": "q0"}},
                        {{"from": "q0", "input": "1", "to": "q1"}},
                        {{"from": "q1", "input": "0", "to": "q0"}},
                        {{"from": "q1", "input": "1", "to": "q2"}},
                        {{"from": "q2", "input": "0", "to": "q2"}},
                        {{"from": "q2", "input": "1", "to": "q2"}}
                    ]
                }}
            }}
            """

        elif topic == "bdo_nfa_builder":
            return base_prompt + f"""
            CRITICAL INSTRUCTION FOR bdo_nfa_builder:
            1. Generate a valid mathematical NFA (Non-Deterministic Finite Automata) problem.
            2. To prove it is an NFA, it MUST include either a lambda (λ) transition, OR multiple transitions from the same state using the same input symbol.
            
            JSON SCHEMA TO FOLLOW:
            {{
                "visualType": "bdo_nfa_builder",
                "questionText": "Alfabesi {{0, 1}} olan ve [BURAYA KURALI YAZIN, Örn: '01' ile biten] dizgileri kabul eden NFA'yı tasarlayınız.",
                "inputData": {{
                    "alphabet": ["0", "1", "λ"]
                }},
                "solutionData": {{
                    "states": ["q0", "q1", "q2"],
                    "startState": "q0",
                    "acceptStates": ["q2"],
                    "transitions": [
                        {{"from": "q0", "input": "0", "to": "q0"}},
                        {{"from": "q0", "input": "1", "to": "q0"}},
                        {{"from": "q0", "input": "0", "to": "q1"}}, 
                        {{"from": "q1", "input": "1", "to": "q2"}}
                    ]
                }}
            }}
            """
        elif topic == "bdo_dfa_reduction":
            return base_prompt + f"""
            CRITICAL INSTRUCTION FOR bdo_dfa_reduction:
            1. Generate a DFA transition table that needs to be minimized.
            2. Provide the original table in inputData.
            
            JSON SCHEMA:
            {{
                "visualType": "bdo_dfa_reduction",
                "questionText": "Aşağıdaki DFA tablosunu inceleyerek durumları indirgeyiniz ve eşdeğer durum gruplarını belirleyiniz.",
                "inputData": {{
                    "originalTable": [
                        {{"state": "q0", "input0": "q1", "input1": "q2", "isAccept": false}},
                        {{"state": "q1", "input0": "q1", "input1": "q2", "isAccept": false}}
                    ]
                }},
                "solutionData": {{
                    "equivalentGroups": [["q0", "q1"], ["q2"]]
                }}
            }}
            """

        elif topic == "bdo_grammar_derivation":
            return base_prompt + f"""
            CRITICAL INSTRUCTION FOR bdo_grammar_derivation:
            1. Provide a Context-Free Grammar.
            2. Ask the student to write the leftmost derivation (soldan türetme) for a specific target string.
            
            JSON SCHEMA TO FOLLOW:
            {{
                "visualType": "bdo_grammar_derivation",
                "questionText": "Aşağıdaki dilbilgisi kurallarını kullanarak '[BURAYA DİZGİ YAZIN, Örn: 0011]' dizgisinin soldan türetme adımlarını sırasıyla yazınız.",
                "inputData": {{
                    "grammarRules": ["S => 0S1", "S => 01"]
                }},
                "solutionData": {{
                    "derivationSteps": ["S", "0S1", "0011"]
                }}
            }}
            """
        
        elif topic == "bdo_pda_builder":
            return base_prompt + f"""
            CRITICAL INSTRUCTION FOR bdo_pda_builder:
            1. Generate a Pushdown Automata (PDA) design problem.
            2. Transitions MUST include 'pop' and 'push' fields.
            
            JSON SCHEMA:
            {{
                "visualType": "bdo_pda_builder",
                "questionText": "Alfabesi {{a, b}} olan ve [a^n b^n] dilini tanıyan PDA'yı tasarlayınız.",
                "inputData": {{ "alphabet": ["a", "b"], "stackAlphabet": ["a", "Z0"] }},
                "solutionData": {{
                    "states": ["q0", "q1"],
                    "startState": "q0",
                    "acceptStates": ["q1"],
                    "transitions": [
                        {{"from": "q0", "input": "a", "pop": "Z0", "to": "q0", "push": "aZ0"}},
                        {{"from": "q0", "input": "b", "pop": "a", "to": "q1", "push": "λ"}}
                    ]
                }}
            }}
            """

        elif topic == "bdo_tm_trace":
            return base_prompt + f"""
            CRITICAL INSTRUCTION FOR bdo_tm_trace:
            1. Provide Turing Machine transitions.
            2. Ask the student to trace the tape and state step-by-step.
            
            JSON SCHEMA TO FOLLOW:
            {{
                "visualType": "bdo_tm_trace",
                "questionText": "Aşağıda kuralları verilen Turing Makinesi için, başlangıç şeridi '[Örn: 101BB]' olan makinenin adım adım durumunu ve şerit içeriğini yazınız. (DİKKAT: Okuma kafasının konumunu göstermek için simgenin önüne * koyunuz, Örn: okuma kafası 0'ın üzerindeyse *01BB yazın).",
                "inputData": {{
                    "machineRules": ["q0, 1 -> q1, X, R", "q1, 0 -> q2, Y, L"],
                    "initialTape": "*101BB"
                }},
                "solutionData": {{
                    "traceSteps": [
                        {{"step": 0, "state": "q0", "tape": "*101BB"}},
                        {{"step": 1, "state": "q1", "tape": "X*01BB"}},
                        {{"step": 2, "state": "q2", "tape": "*XY1BB"}}
                    ]
                }}
            }}
            """

    elif topic == "generic_code":
        return base_prompt + """
        {
            "visualType": "vp_code_completion",
            "questionText": "Aşağıdaki kod bloğunda eksik bırakılan yeri (_____) uygun şekilde doldurunuz.",
            "inputData": {
                "codeSnippet": "// WRITE A DYNAMIC CODE SNIPPET HERE BASED ON THE CONTEXT.\n// USE \n FOR NEWLINES.",
                "language": "python" 
            },
            "solutionData": {
                "correctCode": "the_missing_syntax"
            }
        }
        
        CRITICAL INSTRUCTION FOR generic_code: 
        1. Read the provided CONTEXT. Look at the VARIANT SEED to pick a specific coding concept mentioned in the text.
        2. Write a code snippet and replace one important keyword or variable with '_____'.
        """

    elif topic == "generic_math":
        return base_prompt + """
        {
            "visualType": "generic_math",
            "questionText": "Aşağıdaki problemi çözünüz ve sayısal sonucu yazınız.",
            "inputData": {
                "problemStatement": "WRITE A DYNAMIC CALCULATION PROBLEM HERE BASED ON THE CONTEXT."
            },
            "solutionData": {
                "correctAnswer": "42"
            }
        }
        
        CRITICAL INSTRUCTION FOR generic_math: 
        1. Read the CONTEXT. Find a mathematical formula or numerical concept.
        2. Create a math problem using those rules. Write the problem as a single, flowing paragraph.
        3. VERY IMPORTANT LATEX RULES: 
           - For variables or numbers INSIDE a sentence, you MUST use SINGLE dollar signs (e.g., "Adım büyüklüğü $h = 0.1$ olarak alınacaktır").
           - DO NOT use double dollar signs ($$) inside sentences. It breaks the UI layout.
           - ONLY use double dollar signs ($$) for the final, massive equation at the very end.
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
        elif prefix == "vp": 
            for w in request.weeks:
                if w in VP_CLASSIC_TOPICS:
                    available_topics.extend(VP_CLASSIC_TOPICS[w])
        elif prefix == "bdo":
            for w in request.weeks:
                if w in BDO_CLASSIC_TOPICS:
                    available_topics.extend(BDO_CLASSIC_TOPICS[w])
        else:
            # === THE DYNAMIC COURSE GENERATOR ===
            # If the course is a custom admin course, we use the checkboxes!
            if request.allow_theory: available_topics.append("generic_theory")
            if request.allow_code: available_topics.append("generic_code")
            if request.allow_math: available_topics.append("generic_math")
        
        if not available_topics:
            available_topics = ["generic_theory"]

        selected_topics = [available_topics[i % len(available_topics)] for i in range(request.question_count)]
        random.shuffle(selected_topics)
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
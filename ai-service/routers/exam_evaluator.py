import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/ai", tags=["Exam Evaluator"])

class EvaluateRequest(BaseModel):
    visualType: str
    questionText: str
    solutionData: dict
    studentData: dict

class EvaluationResponse(BaseModel):
    score: int
    feedback: list[str]

def clean_json(text: str) -> str:
    """Helper to clean LLM response for JSON parsing."""
    text = text.strip()
    if text.startswith("```json"): 
        text = text.replace("```json", "", 1)
    if text.startswith("```"): 
        text = text.replace("```", "", 1)
    if text.endswith("```"): 
        text = text[::-1].replace("```", "", 1)[::-1]
    return text.strip()

def get_evaluation_prompt(request: EvaluateRequest) -> str:
    q_type = request.visualType
    # Common JSON instruction
    json_format = """
    OUTPUT FORMAT: Strictly return ONLY a valid JSON object. No explanations or markdown.
    {
        "score": 85,
        "feedback": ["First feedback item.", "Second feedback item."]
    }
    """

    if "bdo_dfa_builder" in q_type or "bdo_nfa_builder" in q_type:
        return f"""
        You are an expert Professor of Formal Languages and Automata Theory.
        
        TASK: Grade a student's Finite Automata (DFA or NFA) construction.
        
        QUESTION: {request.questionText}
        
        REFERENCE SOLUTION (One valid example): 
        {json.dumps(request.solutionData, ensure_ascii=False)}
        
        STUDENT'S ANSWER:
        {json.dumps(request.studentData, ensure_ascii=False)}
        
        GRADING CRITERIA:
        1. **Language Equivalence**: Does the student's machine accept exactly the same language described in the QUESTION?
           - If yes, score is 100 (even if states/transitions differ from reference).
           - If no, penalize based on severity (e.g., accepts invalid strings or rejects valid ones).
        2. **State Names**: IGNORE state names (e.g., q0 vs A). Graph structure matters, not labels.
        3. **Deterministic/Non-Deterministic**: 
           - If question asked for DFA but student made NFA (e.g. missing transitions), penalize slightly (e.g. -10 pts).
           - If NFA was asked, DFA is usually acceptable unless specified otherwise.
        
        FEEDBACK INSTRUCTIONS:
        - Provide feedback in TURKISH.
        - Be specific. Example: "'101' dizgisini kabul etmeliydi ama reddediyor." or "Gereksiz 'q3' durumu var."
        
        {json_format}
        """

    elif "bdo_regex" in q_type:
        return f"""
        You are an expert Professor of Formal Languages regarding Regular Expressions.
        
        TASK: Grade a student's Regex.
        
        QUESTION: {request.questionText}
        
        REFERENCE SOLUTION: 
        {json.dumps(request.solutionData, ensure_ascii=False)}
        
        STUDENT'S ANSWER:
        {json.dumps(request.studentData, ensure_ascii=False)}
        
        GRADING CRITERIA:
        1. **Equivalence**: Does the student's regex define the exact same language as the question?
           - Example: (a+b)* and (a|b)* are equal. 100 points.
        2. **Syntax**: Is it a valid regex notation?
        
        FEEDBACK INSTRUCTIONS:
        - Provide feedback in TURKISH.
        - If incorrect, provide a counter-example (a string that fails).
        
        {json_format}
        """
    
    elif "bdo_grammar_derivation" in q_type:
        return f"""
        You are a Professor grading a Context-Free Grammar Leftmost Derivation.
        QUESTION: {request.questionText}
        GRAMMAR RULES: {json.dumps(request.solutionData, ensure_ascii=False)}
        STUDENT'S DERIVATION STEPS: {json.dumps(request.studentData, ensure_ascii=False)}
        
        GRADING PROTOCOL:
        1. Check if the student correctly applied the grammar rules step-by-step.
        2. Check if it is strictly a LEFTMOST derivation (soldan türetme).
        3. If they skipped steps, made up rules, or didn't expand the leftmost variable, deduct points.
        4. If it is 100% correct, score 100.
        
        FEEDBACK: Write in TURKISH. If they made a mistake, tell them exactly at which step they failed and why.
        {json_format}
        """

    elif "bdo_tm_trace" in q_type:
        return f"""
        You are a Professor grading a Turing Machine Trace.
        QUESTION: {request.questionText}
        TM RULES: {json.dumps(request.solutionData, ensure_ascii=False)}
        STUDENT'S TRACE: {json.dumps(request.studentData, ensure_ascii=False)}
        
        GRADING PROTOCOL:
        1. Trace the machine yourself mentally using the provided rules and initial tape.
        2. Check the student's trace step-by-step. The '*' indicates the read head.
        3. Verify the state transition, the symbol written to the tape, and the Left/Right head movement at every step.
        4. If they made a mistake in state, tape symbol, or head position, deduct points heavily.
        
        FEEDBACK: Write in TURKISH. If incorrect, explain exactly which step failed (e.g., "Adım 2'de okuma kafası sağa (R) gitmeliydi, sola gitmişsiniz.")
        {json_format}
        """
        
    elif "vp_code_completion" in q_type:
         return f"""
        You are a Computer Science Professor grading a Coding fill-in-the-blank question.
        
        QUESTION: {request.questionText}
        
        REFERENCE ANSWER: 
        {json.dumps(request.solutionData, ensure_ascii=False)}
        
        STUDENT'S ANSWER:
        {json.dumps(request.studentData, ensure_ascii=False)}
        
        GRADING CRITERIA:
        1. Code Logic: Does the student's code snippet correctly complete the logic?
        2. Syntax: Is it valid syntax for the language?
        
        FEEDBACK INSTRUCTIONS:
        - Provide feedback in TURKISH.
        
        {json_format}
        """

    else:
        # Fallback generic grader
        return f"""
        You are an expert University Professor.
        
        QUESTION: {request.questionText}
        
        REFERENCE SOLUTION: 
        {json.dumps(request.solutionData, ensure_ascii=False)}
        
        STUDENT'S ANSWER:
        {json.dumps(request.studentData, ensure_ascii=False)}
        
        TASK: Grade the student's answer based on logic and correctness relative to the question.
        
        FEEDBACK: In TURKISH.
        
        {json_format}
        """

@router.post("/evaluate-classic")
async def evaluate_classic_answer(request: EvaluateRequest):
    try:
        # Use a slightly more creative temperature for evaluation to allow for reasoning
        # but keep it low enough to be consistent.
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.2
        )

        prompt = get_evaluation_prompt(request)

        response = await llm.ainvoke(prompt)
        
        clean_txt = clean_json(response.content)
        evaluation = json.loads(clean_txt)

        # Enforce content
        data = {
            "score": evaluation.get("score", 0),
            "feedback": evaluation.get("feedback", ["Değerlendirme alınamadı."])
        }
        
        return {"success": True, "data": data}

    except Exception as e:
        print(f"Evaluation Error: {e}")
        return {"success": False, "error": str(e)}

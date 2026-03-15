from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import test_generator # 👈 Import the new unified router
from routers import exam_generator # 👈 Import the exam generator router
from routers import exam_evaluator # 👈 Import the exam evaluator router
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="GaziStudyAI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(test_generator.router) # 👈 Register it here
app.include_router(exam_generator.router) # 👈 And the exam generator too!
app.include_router(exam_evaluator.router) # 👈 Register the evaluator

@app.get("/")
def read_root():
    return {"message": "GaziStudyAI Python Service is Online!"}
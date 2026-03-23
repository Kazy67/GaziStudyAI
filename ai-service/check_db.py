# check_db.py
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

print("🔍 Inspecting Vector Database...")

# 1. Connect to the DB
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
db = Chroma(persist_directory="./vector_db", embedding_function=embeddings)

# 2. Get all data
data = db.get()
total_chunks = len(data['ids'])

if total_chunks == 0:
    print("⚠️ The database is currently empty.")
else:
    print(f"✅ Total text chunks in DB: {total_chunks}")
    
    # 3. Extract unique metadata (Files and Weeks)
    unique_weeks = set([meta.get('week') for meta in data['metadatas'] if meta])
    unique_sources = set([meta.get('source') for meta in data['metadatas'] if meta])

    print("\n📂 Uploaded Files:")
    for source in unique_sources:
        print(f"  - {source}")

    print("\n📅 Available Weeks (Tags):")
    for week in unique_weeks:
        print(f"  - {week}")
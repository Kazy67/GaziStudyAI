import os
import shutil
from langchain_community.document_loaders import PyPDFLoader, PDFPlumberLoader, TextLoader # <--- Import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

def safe_ingest():
    # 1. Clean Slate
    if os.path.exists("./vector_db"):
        print("🧹 Deleting old database...")
        shutil.rmtree("./vector_db")

    folders = [
        {"path": "./materials/isletim-sistemleri"},
        {"path": "./materials/gorsel-programlama"}
    ]
    
    print("🧠 Initializing embeddings...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = Chroma(persist_directory="./vector_db", embedding_function=embeddings)

    total_files = 0
    total_chunks = 0

    for folder in folders:
        path = folder["path"]
        if not os.path.exists(path): continue

        print(f"\n📂 Processing folder: {path}")
        
        # LOOK FOR BOTH PDF AND TXT FILES
        files = sorted([f for f in os.listdir(path) if f.endswith(".pdf") or f.endswith(".txt")])

        for filename in files:
            file_path = os.path.join(path, filename)
            
            # Create ID: "vp_hafta_1.txt" -> "vp_hafta_1"
            week_id = os.path.splitext(filename)[0].lower() 
            
            docs = []

            # --- CASE 1: TEXT FILES ---
            if filename.endswith(".txt"):
                try:
                    # Using UTF-8 encoding is important for Turkish characters
                    loader = TextLoader(file_path, encoding='utf-8')
                    docs = loader.load()
                    print(f"   📄 Loading TEXT: {week_id}", end="")
                except Exception as e:
                    print(f"   ❌ Failed to load text file {filename}: {e}")
                    continue

            # --- CASE 2: PDF FILES ---
            elif filename.endswith(".pdf"):
                print(f"   📄 Loading PDF: {week_id}", end="")
                try:
                    loader = PyPDFLoader(file_path)
                    docs = loader.load()
                except:
                    docs = []

                # Fallback to PDFPlumber if needed
                has_text = any(d.page_content and len(d.page_content.strip()) > 10 for d in docs)
                if not has_text:
                    try:
                        loader = PDFPlumberLoader(file_path)
                        docs = loader.load()
                    except:
                        pass
            
            # Skip if empty
            if not docs:
                print(" -> ❌ SKIPPED (Empty)")
                continue

            # --- SPLIT & SAVE ---
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            chunks = text_splitter.split_documents(docs)

            if not chunks:
                print(" -> ❌ SKIPPED (0 Chunks)")
                continue

            # Tag Metadata
            for doc in chunks:
                doc.metadata["week"] = week_id
                doc.metadata["source"] = filename

            # Add to DB
            db.add_documents(chunks)
            print(f" -> 💾 Saved {len(chunks)} chunks ✅")
            
            total_files += 1
            total_chunks += len(chunks)

    print(f"\n🎉 FINAL REPORT: Processed {total_files} files and {total_chunks} chunks.")

if __name__ == "__main__":
    safe_ingest()
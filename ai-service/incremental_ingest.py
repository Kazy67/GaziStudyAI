import os
from langchain_community.document_loaders import PyPDFLoader, PDFPlumberLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

def incremental_ingest():
    # ❌ NOTICE: The "Clean Slate" (shutil.rmtree) block is REMOVED!
    # This ensures your existing OS and VP data stays completely safe.

    # 👇 ONLY put the new BDO folder here so we don't duplicate OS and VP data
    folders = [
        {"path": "./materials/bicimsel_diller_otomata"}
    ]
    
    print("🧠 Connecting to EXISTING database...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    # This will load the existing DB instead of overwriting it
    db = Chroma(persist_directory="./vector_db", embedding_function=embeddings)

    total_files = 0
    total_chunks = 0

    for folder in folders:
        path = folder["path"]
        if not os.path.exists(path): 
            print(f"❌ Folder not found: {path}")
            continue

        print(f"\n📂 Processing folder: {path}")
        
        files = sorted([f for f in os.listdir(path) if f.endswith(".pdf") or f.endswith(".txt")])

        for filename in files:
            file_path = os.path.join(path, filename)
            
            week_id = os.path.splitext(filename)[0].lower() 
            
            docs = []

            if filename.endswith(".txt"):
                try:
                    loader = TextLoader(file_path, encoding='utf-8')
                    docs = loader.load()
                    print(f"   📄 Loading TEXT: {week_id}", end="")
                except Exception as e:
                    print(f"   ❌ Failed to load text file {filename}: {e}")
                    continue

            elif filename.endswith(".pdf"):
                print(f"   📄 Loading PDF: {week_id}", end="")
                try:
                    loader = PyPDFLoader(file_path)
                    docs = loader.load()
                except:
                    docs = []

                has_text = any(d.page_content and len(d.page_content.strip()) > 10 for d in docs)
                if not has_text:
                    try:
                        loader = PDFPlumberLoader(file_path)
                        docs = loader.load()
                    except:
                        pass
            
            if not docs:
                print(" -> ❌ SKIPPED (Empty)")
                continue

            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            chunks = text_splitter.split_documents(docs)

            if not chunks:
                print(" -> ❌ SKIPPED (0 Chunks)")
                continue

            for doc in chunks:
                doc.metadata["week"] = week_id
                doc.metadata["source"] = filename

            # Add to the EXISTING DB
            db.add_documents(chunks)
            print(f" -> 💾 Saved {len(chunks)} chunks ✅")
            
            total_files += 1
            total_chunks += len(chunks)

    print(f"\n🎉 FINAL REPORT: Processed {total_files} files and added {total_chunks} new chunks to the existing database.")

if __name__ == "__main__":
    incremental_ingest()
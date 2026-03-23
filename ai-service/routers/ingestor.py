import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from typing import Optional

router = APIRouter(prefix="/ai", tags=["Material Ingestion"])

@router.post("/ingest-material")
async def ingest_material(
    file: UploadFile = File(...),  # file: UploadFile = File(...) tells FastAPI: "Expect a binary file attached to this request under the key file."
    week_tag: str = Form(...) # e.g., "mth_hafta_1" week_tag: str = Form(...) tells FastAPI: "Expect a regular text string attached to this same multipart request under the key week_tag."
):
    try:
        # 1. Save the uploaded file temporarily
        temp_dir = "./temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, file.filename)
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Load the Document based on extension
        docs = []
        if file.filename.endswith(".txt"):
            loader = TextLoader(temp_path, encoding='utf-8')
            docs = loader.load()
        elif file.filename.endswith(".pdf"):
            loader = PyPDFLoader(temp_path)
            docs = loader.load()
        else:
            os.remove(temp_path)
            raise HTTPException(status_code=400, detail="Only .pdf and .txt files are supported.")

        if not docs:
            os.remove(temp_path)
            return {"success": False, "error": "No text could be extracted from the file."}

        # 3. Split into Chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(docs)

        # 4. Attach the dynamic week tag (e.g., "os_hafta_1", "mth_hafta_3")
        for doc in chunks:
            doc.metadata["week"] = week_tag.lower()
            doc.metadata["source"] = file.filename

        # 5. Insert into existing ChromaDB
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = Chroma(persist_directory="./vector_db", embedding_function=embeddings)
        db.add_documents(chunks)

        # 6. Cleanup temp file
        os.remove(temp_path)

        return {"success": True, "message": f"Successfully ingested {len(chunks)} chunks for {week_tag}"}

    except Exception as e:
        if os.path.exists(temp_path): os.remove(temp_path)
        return {"success": False, "error": str(e)}
    

@router.get("/course-materials/{prefix}")
async def get_course_materials(prefix: str):
    """Returns a list of weeks that have uploaded materials for a specific course prefix."""
    try:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = Chroma(persist_directory="./vector_db", embedding_function=embeddings)
        
        data = db.get()
        if not data or not data["metadatas"]:
            return {"success": True, "data": {}}

        # Find all chunks that belong to this course prefix (e.g., "os")
        course_data = {}
        for meta in data["metadatas"]:
            if meta and "week" in meta and meta["week"].startswith(prefix.lower()):
                week_tag = meta["week"]
                source = meta.get("source", "Unknown File")
                if week_tag not in course_data:
                    course_data[week_tag] = source # e.g., {"os_hafta_1": "os_chapter1.pdf"}

        return {"success": True, "data": course_data}
    except Exception as e:
        return {"success": False, "error": str(e)}
    

@router.delete("/delete-material/{week_tag}")
async def delete_material(week_tag: str):
    """Deletes all chunks from the database for a specific week."""
    try:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = Chroma(persist_directory="./vector_db", embedding_function=embeddings)
        
        # Find all chunks with this week_tag
        docs_to_delete = db.get(where={"week": week_tag.lower()})
        
        if docs_to_delete and docs_to_delete["ids"]:
            db._collection.delete(ids=docs_to_delete["ids"])
            return {"success": True, "message": f"Deleted {len(docs_to_delete['ids'])} chunks for {week_tag}"}
        
        return {"success": False, "message": "No data found for this week."}
    except Exception as e:
        return {"success": False, "error": str(e)}
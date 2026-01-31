from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
import pdfplumber
import shutil
from pathlib import Path



pdf_dir = Path("sample-docs")
pdf_files = list(pdf_dir.glob("*.pdf"))
dataframes = [{"path": str(filepath), "content": ""}  for filepath in pdf_files]  


for i, filepath in enumerate(pdf_files):
    with pdfplumber.open(filepath) as pdf:
        df = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                df += text + "\n\n"
        dataframes[i]["content"] = df


embeddings = OllamaEmbeddings(model="mxbai-embed-large")

db_location = "./chroma_db"

if os.path.exists(db_location):
    shutil.rmtree(db_location)

documents = []
ids = []

# Use this because it can split with much smaller chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ". ", " ", ""]
)

allFileChunks = [{"path": df["path"], "content": splitter.split_text(df["content"])} for df in dataframes]

id = 0
for file_data in allFileChunks:
    for chunk in file_data["content"]: 
        id += 1
        clean_chunk = chunk.strip()
        if not clean_chunk or len(clean_chunk) < 5:
            continue
    
        document = Document(
            page_content=clean_chunk,
            metadata={"source": str(file_data["path"])}, 
            id=str(id)
        )
        ids.append(str(id))
        documents.append(document)

if documents:
    print(f"Chunk size range: {len(documents[0].page_content)} - {len(documents[-1].page_content)} characters")

vector_store = Chroma(
    collection_name="comp_sci_assignments",
    persist_directory=db_location,
    embedding_function=embeddings
)

# Only add new documents if DB is empty
if len(vector_store.get()["ids"]) == 0:
    vector_store.add_documents(documents=documents, ids=ids)
    
print("Vector store created successfully")


retriever = vector_store.as_retriever(search_kwargs={"k": 8})

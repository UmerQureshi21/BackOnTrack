from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
import pdfplumber
import shutil
from pathlib import Path

df = ""
filepath = "sample-docs/Week 6-2 Agile Software Development - Part 1.pdf"

pdf_dir = Path("sample-docs")
pdf_files = list(pdf_dir.glob("*.pdf"))

with pdfplumber.open(filepath) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            df += text + "\n\n"

print(f"Total extracted text length: {len(df)} characters")

embeddings = OllamaEmbeddings(model="mxbai-embed-large")

db_location = "./chroma_db"

if os.path.exists(db_location):
    shutil.rmtree(db_location)

documents = []
ids = []

# Use RecursiveCharacterTextSplitter with much smaller chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ". ", " ", ""]
)
chunks = splitter.split_text(df)

print(f"Created {len(chunks)} chunks")

for i, chunk in enumerate(chunks):
    clean_chunk = chunk.strip()
    if not clean_chunk or len(clean_chunk) < 5:
        continue
    
    document = Document(
        page_content=clean_chunk,
        metadata={"source": filepath},
        id=str(i)
    )
    ids.append(str(i))
    documents.append(document)

print(f"Adding {len(documents)} documents to vector store")

if documents:
    print(f"Chunk size range: {len(documents[0].page_content)} - {len(documents[-1].page_content)} characters")

vector_store = Chroma(
    collection_name="comp_sci_assignments",
    persist_directory=db_location,
    embedding_function=embeddings
)

vector_store.add_documents(documents=documents, ids=ids)

print("Vector store created successfully")

print(vector_store.get())

retriever = vector_store.as_retriever(search_kwargs={"k": 5})
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

model = OllamaLLM(model="llama3.2")

template = """
You are an expert in explaining computer science assignments.

Here is relevant assignment information: {reviews}

Here is the question to answer: {question}

Provide a clear and concise answer based on the assignment details.
"""

prompt = ChatPromptTemplate.from_template(template)

chain = prompt | model

while True:
    print("\n" + "-----------------------------")
    question = input("Enter your question about the assignment (or 'q' to quit): ")
    print("-----------------------------\n")
    if question.lower() == 'q':
        break

    # Get relevant documents and convert to text
    docs = retriever.invoke(question)
    print(f"DEBUG: Retrieved {len(docs)} documents")  # Debug line
    
    reviews = "\n\n".join([doc.page_content for doc in docs])
    print(f"DEBUG: Reviews length: {len(reviews)} characters")  # Debug line
    
    result = chain.invoke({"reviews": reviews, "question": question})
    print(result)
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

model = OllamaLLM(model="llama3.2")

template = """
You are assigned to monitor the conversations of a consenting study group and assess whether those
conversations are off topic or not.

Here is relevant assignment or lesson information: {reviews}

Here are their conversations: {question}

Provide a clear and concise rating of how on task they are from 0 - 100. Only say the rating.
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
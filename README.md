## AI Code Refactoring & Optimization Engine

This project leverages Large Language Models (LLMs) to analyze and refactor user-submitted code. It features a Go backend, a Rust service for code analysis, and a React frontend.

### Features

- **Code Refactoring**: Submit your code to get refactoring suggestions from an AI model.
- **Similar Code Search**: Find code snippets similar to yours from a vector database.

### Prerequisites

- Docker and Docker Compose
- An OpenAI API key

### Getting Started

1.  **Set up your environment variables.**

    Create a `.env` file in the root of the project with your OpenAI API key:

    ```
    OPENAI_API_KEY="your-openai-api-key"
    ```

2.  **Build and run the application.**

    ```bash
    docker-compose up --build
    ```

3.  **Access the application.**

    -   Frontend: [http://localhost:3000](http://localhost:3000)
    -   Backend GraphQL Playground: [http://localhost:8080/graphql](http://localhost:8080/graphql)

### Architecture

-   **Frontend**: A React application for submitting code and viewing results.
-   **Backend**: A Go GraphQL server that handles user requests, manages data, and communicates with other services.
-   **Rust Service**: A service for CPU-intensive tasks, such as calling the LLM for code analysis.
-   **Vector DB**: A Qdrant vector database for storing code embeddings and enabling similarity search.

### Future Work

-   **User Project Management**: The current implementation handles individual code snippets. A potential next step is to introduce the concept of "projects" to manage multiple related code files. This would involve changes to the backend, database, and frontend.
-   **More Sophisticated LLM Interaction**: The prompts and models used for refactoring and embedding can be further optimized for better results.
-   **Real-time Collaboration**: Features for real-time collaboration on code refactoring could be added. 
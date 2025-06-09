use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use dotenvy::dotenv;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Deserialize)]
struct AnalyzeRequest {
    code: String,
}

#[derive(Serialize)]
struct AnalyzeResponse {
    refactored_code: String,
    error: String,
}

#[derive(Serialize)]
struct OpenAIChatRequest {
    model: String,
    messages: Vec<Message>,
}

#[derive(Serialize, Deserialize, Clone)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct OpenAIChatResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: Message,
}

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello from rust-service!")
}

async fn get_refactoring_suggestion(code: &str, api_key: &str) -> Result<String, reqwest::Error> {
    let client = Client::new();
    let prompt = format!("Please refactor the following Rust code and provide a brief explanation of the changes. Return only the refactored code. \n\n```rust\n{}\n```", code);

    let messages = vec![Message {
        role: "user".to_string(),
        content: prompt,
    }];

    let request_body = OpenAIChatRequest {
        model: "gpt-3.5-turbo-0125".to_string(),
        messages,
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request_body)
        .send()
        .await?;

    let response_body: OpenAIChatResponse = response.json().await?;

    if let Some(choice) = response_body.choices.get(0) {
        Ok(choice.message.content.clone())
    } else {
        Ok("No suggestion found.".to_string())
    }
}

#[post("/analyze")]
async fn analyze(req: web::Json<AnalyzeRequest>) -> impl Responder {
    let original_code = &req.code;
    let api_key = match env::var("OPENAI_API_KEY") {
        Ok(key) => key,
        Err(_) => {
            return HttpResponse::InternalServerError().json(AnalyzeResponse {
                refactored_code: "".to_string(),
                error: "OPENAI_API_KEY not set in environment".to_string(),
            });
        }
    };

    match get_refactoring_suggestion(original_code, &api_key).await {
        Ok(suggestion) => HttpResponse::Ok().json(AnalyzeResponse {
            refactored_code: suggestion,
            error: "".to_string(),
        }),
        Err(e) => HttpResponse::InternalServerError().json(AnalyzeResponse {
            refactored_code: "".to_string(),
            error: e.to_string(),
        }),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok(); // This line loads the .env file

    HttpServer::new(|| App::new().service(hello).service(analyze))
        .bind(("0.0.0.0", 8081))?
        .run()
        .await
}

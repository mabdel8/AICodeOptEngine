use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct AnalyzeRequest {
    code: String,
}

#[derive(Serialize)]
struct AnalyzeResponse {
    line_count: usize,
}

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello from rust-service!")
}

#[post("/analyze")]
async fn analyze(req: web::Json<AnalyzeRequest>) -> impl Responder {
    let line_count = req.code.lines().count();
    HttpResponse::Ok().json(AnalyzeResponse { line_count })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(analyze)
    })
    .bind(("0.0.0.0", 8081))?
    .run()
    .await
}

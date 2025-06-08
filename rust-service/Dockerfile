# syntax=docker/dockerfile:1

FROM rust:1.58 as builder

WORKDIR /usr/src/rust-service
COPY . .
RUN cargo install --path .

FROM debian:buster-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/cargo/bin/rust-service /usr/local/bin/rust-service
EXPOSE 8081
CMD ["rust-service"] 
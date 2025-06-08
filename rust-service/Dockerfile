# syntax=docker/dockerfile:1

FROM rust:latest as builder

# Install musl-tools for the C compiler
RUN apt-get update && apt-get install -y musl-tools

WORKDIR /usr/src/rust-service

# Install musl target
RUN rustup target add x86_64-unknown-linux-musl

COPY . .

# Build for musl target
RUN cargo build --release --target x86_64-unknown-linux-musl

# Use a minimal image for the final stage
FROM alpine:latest

# Copy the statically linked binary
COPY --from=builder /usr/src/rust-service/target/x86_64-unknown-linux-musl/release/rust-service /usr/local/bin/rust-service

EXPOSE 8081
CMD ["rust-service"] 
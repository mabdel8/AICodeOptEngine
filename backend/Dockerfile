# syntax=docker/dockerfile:1

FROM golang:1.22-alpine

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY *.go ./

RUN go build -o /bin/backend

EXPOSE 8080

CMD [ "/bin/backend" ] 
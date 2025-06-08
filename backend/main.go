package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
)

type RustAnalyzeResponse struct {
	LineCount int `json:"line_count"`
}

// Define the GraphQL schema
var rootMutation = graphql.NewObject(graphql.ObjectConfig{
	Name: "RootMutation",
	Fields: graphql.Fields{
		"submitCode": &graphql.Field{
			Type: graphql.Int,
			Args: graphql.FieldConfigArgument{
				"code": &graphql.ArgumentConfig{
					Type: graphql.NewNonNull(graphql.String),
				},
			},
			Resolve: func(params graphql.ResolveParams) (interface{}, error) {
				code, _ := params.Args["code"].(string)
				log.Printf("Received code, sending to rust-service for analysis...")

				// Prepare the request body
				requestBody, err := json.Marshal(map[string]string{"code": code})
				if err != nil {
					log.Printf("Error marshalling request body: %s", err)
					return nil, err
				}

				// Send the code to the rust-service for analysis
				resp, err := http.Post("http://rust-service:8081/analyze", "application/json", bytes.NewBuffer(requestBody))
				if err != nil {
					log.Printf("Error sending request to rust-service: %s", err)
					return nil, err
				}
				defer resp.Body.Close()

				// Decode the response
				var analyzeResponse RustAnalyzeResponse
				if err := json.NewDecoder(resp.Body).Decode(&analyzeResponse); err != nil {
					log.Printf("Error decoding response from rust-service: %s", err)
					return nil, err
				}

				log.Printf("Analysis complete: %d lines", analyzeResponse.LineCount)
				return analyzeResponse.LineCount, nil
			},
		},
	},
})

var schema graphql.Schema

func init() {
	var err error
	schema, err = graphql.NewSchema(
		graphql.SchemaConfig{
			Query: graphql.NewObject(
				graphql.ObjectConfig{
					Name: "Query",
					Fields: graphql.Fields{
						"hello": &graphql.Field{
							Type: graphql.String,
							Resolve: func(p graphql.ResolveParams) (interface{}, error) {
								return "world", nil
							},
						},
					},
				},
			),
			Mutation: rootMutation,
		},
	)
	if err != nil {
		log.Fatalf("failed to create schema, error: %v", err)
	}
}

func main() {
	h := handler.New(&handler.Config{
		Schema:   &schema,
		Pretty:   true,
		GraphiQL: true,
	})

	http.Handle("/graphql", h)

	log.Println("Server started at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
} 
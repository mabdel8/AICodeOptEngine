package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
	"github.com/joho/godotenv"
	"github.com/qdrant/go-client/qdrant"
	"github.com/rs/cors"
	"github.com/sashabaranov/go-openai"
)

var (
	qdrantClient     *qdrant.Client
	openaiClient     *openai.Client
	collectionName   = "code-snippets"
	vectorSize       = uint64(1536) // OpenAI's text-embedding-ada-002 has 1536 dimensions
	distance         = qdrant.Distance_Cosine
)

type RustAnalyzeResponse struct {
	RefactoredCode string `json:"refactored_code"`
	Error          string `json:"error"`
}

// Define the GraphQL schema
var rootMutation = graphql.NewObject(graphql.ObjectConfig{
		Name: "RootMutation",
		Fields: graphql.Fields{
			"submitCode": &graphql.Field{
				Type: graphql.String,
				Args: graphql.FieldConfigArgument{
					"code": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.String),
					},
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					code, _ := params.Args["code"].(string)

					// Save to Qdrant
					go func() {
						ctx := context.Background()
						id := uuid.New().String()
						log.Printf("Upserting point %s to Qdrant", id)

						// Generate embeddings using OpenAI
						embedding, err := getEmbedding(ctx, code)
						if err != nil {
							log.Printf("Error getting embedding from OpenAI: %s", err)
							return
						}

						payload := qdrant.NewValueMap(map[string]interface{}{"code": code})

						_, err = qdrantClient.Upsert(ctx, &qdrant.UpsertPoints{
							CollectionName: collectionName,
							Points: []*qdrant.PointStruct{
								{
									Id:      qdrant.NewID(id),
									Vectors: qdrant.NewVectors(embedding...),
									Payload: payload,
								},
							},
							Wait: qdrant.PtrOf(true),
						})
						if err != nil {
							log.Printf("Error upserting point to Qdrant: %s", err)
							return
						}
						log.Printf("Successfully upserted point %s to Qdrant", id)
					}()

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

					if analyzeResponse.Error != "" {
						log.Printf("Error from rust-service: %s", analyzeResponse.Error)
						// It's important to return a GraphQL error here so the client can handle it
						return nil, graphql.NewLocatedError(analyzeResponse.Error, nil)
					}

					log.Printf("Analysis complete: received suggestion.")
					return analyzeResponse.RefactoredCode, nil
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
						"getSimilarCode": &graphql.Field{
							Type: graphql.NewList(graphql.String), // Returns a list of strings
							Args: graphql.FieldConfigArgument{
								"code": &graphql.ArgumentConfig{
									Type: graphql.NewNonNull(graphql.String),
								},
							},
							Resolve: func(params graphql.ResolveParams) (interface{}, error) {
								code, ok := params.Args["code"].(string)
								if !ok {
									return nil, nil
								}

								log.Printf("Received code, searching for similar snippets in Qdrant...")

								// Generate an embedding for the input code
								queryVector, err := getEmbedding(context.Background(), code)
								if err != nil {
									log.Printf("Error getting embedding from OpenAI: %s", err)
									return nil, err
								}

								// Search Qdrant for similar vectors
								searchResult, err := qdrantClient.Query(
									context.Background(),
									&qdrant.QueryPoints{
										CollectionName: collectionName,
										Query:          qdrant.NewQuery(queryVector...),
										Limit:          qdrant.PtrOf(uint64(5)), // Get top 5 similar snippets
										WithPayload:    qdrant.NewWithPayload(true),
									},
								)
								if err != nil {
									log.Printf("Error searching Qdrant: %s", err)
									return nil, err
								}

								// Extract code from the payload of the search results
								var similarCodeSnippets []string
								for _, point := range searchResult {
									if payloadMap := point.GetPayload(); payloadMap != nil {
										if codeVal, ok := payloadMap["code"]; ok {
											codeStr := codeVal.GetStringValue()
											similarCodeSnippets = append(similarCodeSnippets, codeStr)
										}
									}
								}

								log.Printf("Found %d similar snippets", len(similarCodeSnippets))
								return similarCodeSnippets, nil
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

	// Load .env file
	err = godotenv.Load()
	if err != nil {
		log.Println("No .env file found, reading from environment variables")
	}

	// Initialize OpenAI client
	openaiKey := os.Getenv("OPENAI_API_KEY")
	if openaiKey == "" {
		log.Fatal("OPENAI_API_KEY environment variable not set")
	}
	openaiClient = openai.NewClient(openaiKey)

	// Initialize Qdrant client
	qdrantClient, err = qdrant.NewClient(&qdrant.Config{
		Host: "vector-db",
		Port: 6334,
	})
	if err != nil {
		log.Fatalf("failed to connect to qdrant: %v", err)
	}

	// Check if collection exists
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	exists, err := qdrantClient.CollectionExists(ctx, collectionName)
	if err != nil {
		log.Fatalf("failed to check if collection exists: %v", err)
	}

	if !exists {
		log.Printf("Collection '%s' does not exist, creating it now.", collectionName)
		err = qdrantClient.CreateCollection(ctx, &qdrant.CreateCollection{
			CollectionName: collectionName,
			VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
				Size:     vectorSize,
				Distance: distance,
			}),
		})
		if err != nil {
			log.Fatalf("failed to create collection: %v", err)
		}
		log.Printf("Collection '%s' created successfully.", collectionName)
	} else {
		log.Printf("Collection '%s' already exists.", collectionName)
	}
}

func getEmbedding(ctx context.Context, text string) ([]float32, error) {
	resp, err := openaiClient.CreateEmbeddings(ctx, openai.EmbeddingRequest{
		Input: []string{text},
		Model: openai.AdaEmbeddingV2,
	})
	if err != nil {
		return nil, err
	}
	return resp.Data[0].Embedding, nil
}

func main() {
	h := handler.New(&handler.Config{
		Schema:   &schema,
		Pretty:   true,
		GraphiQL: true,
	})

	// Add CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowCredentials: true,
	})

	http.Handle("/graphql", c.Handler(h))

	log.Println("Server started at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
} 
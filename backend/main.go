package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/graphql-go/graphql"
)

// Define the GraphQL schema
var schema, _ = graphql.NewSchema(
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
	},
)

func main() {
	http.HandleFunc("/graphql", func(w http.ResponseWriter, r *http.Request) {
		result := graphql.Do(graphql.Params{
			Schema:        schema,
			RequestString: r.URL.Query().Get("query"),
		})
		json.NewEncoder(w).Encode(result)
	})

	log.Println("Server started at http://localhost:8080/graphql")
	log.Fatal(http.ListenAndServe(":8080", nil))
} 
import React, { useState } from 'react';
import { useMutation, gql, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache(),
});

const SUBMIT_CODE_MUTATION = gql`
  mutation SubmitCode($code: String!) {
    submitCode(code: $code)
  }
`;

function App() {
  const [code, setCode] = useState('');
  const [submitCode, { data, loading, error }] = useMutation(SUBMIT_CODE_MUTATION);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submitCode({ variables: { code } });
  };

  return (
    <div>
      <h1>AI Code Refactoring & Optimization Engine</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={20}
          cols={80}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..."
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Code'}
        </button>
      </form>

      {error && <p>Error: {error.message}</p>}
      {data && (
        <div>
          <h2>Analysis Results:</h2>
          <p>Line Count: {data.submitCode}</p>
        </div>
      )}
    </div>
  );
}

const WrappedApp = () => (
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);

export default WrappedApp;

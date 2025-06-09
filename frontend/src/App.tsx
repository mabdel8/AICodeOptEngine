import React, { useState } from 'react';
import { useMutation, gql, ApolloClient, InMemoryCache, ApolloProvider, useLazyQuery } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache(),
});

const SUBMIT_CODE_MUTATION = gql`
  mutation SubmitCode($code: String!) {
    submitCode(code: $code)
  }
`;

const GET_SIMILAR_CODE_QUERY = gql`
  query GetSimilarCode($code: String!) {
    getSimilarCode(code: $code)
  }
`;

function SimilarCodeFinder() {
  const [requestCode, setRequestCode] = useState('');
  const [getSimilarCode, { data, loading, error }] = useLazyQuery(GET_SIMILAR_CODE_QUERY);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    getSimilarCode({ variables: { code: requestCode } });
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <hr />
      <h2>Find Similar Code</h2>
      <form onSubmit={handleSearch}>
        <textarea
          rows={10}
          cols={80}
          value={requestCode}
          onChange={(e) => setRequestCode(e.target.value)}
          placeholder="Paste code here to find similar snippets..."
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Find Similar'}
        </button>
      </form>

      {error && <p>Error finding similar code: {error.message}</p>}
      {data && data.getSimilarCode && (
        <div>
          <h3>Similar Code Snippets:</h3>
          {data.getSimilarCode.map((snippet: string, index: number) => (
            <pre key={index} style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
              <code>{snippet}</code>
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}

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
          <pre>
            <code>{data.submitCode}</code>
          </pre>
        </div>
      )}

      <SimilarCodeFinder />
    </div>
  );
}

const WrappedApp = () => (
  <div className="App">
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </div>
);

export default WrappedApp;

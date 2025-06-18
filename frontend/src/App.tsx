import React, { useState } from 'react';
import { useMutation, gql, ApolloClient, InMemoryCache, ApolloProvider, useLazyQuery } from '@apollo/client';
import './App.css';

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

// SVG Icons
const CodeIcon = () => (
  <svg className="card-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.325 3.05011L8.66741 20.4323L10.5993 20.9499L15.2568 3.56775L13.325 3.05011Z" fill="currentColor"/>
    <path d="M7.61197 18.3608L8.97136 16.9124L8.97086 16.912L2.39037 10.9999L8.97086 5.08781L8.97136 5.08737L7.61197 3.63898L0.97136 9.61161C0.195262 10.2946 0.195262 11.7052 0.97136 12.3882L7.61197 18.3608Z" fill="currentColor"/>
    <path d="M16.388 18.3608L15.0286 16.9124L15.0291 16.912L21.6096 10.9999L15.0291 5.08781L15.0286 5.08737L16.388 3.63898L23.0286 9.61161C23.8047 10.2946 23.8047 11.7052 23.0286 12.3882L16.388 18.3608Z" fill="currentColor"/>
  </svg>
);

const SearchIcon = () => (
  <svg className="card-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function CodeAnalyzer() {
  const [code, setCode] = useState('');
  const [submitCode, { data, loading, error }] = useMutation(SUBMIT_CODE_MUTATION);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (code.trim()) {
      submitCode({ variables: { code } });
    }
  };

  return (
    <div className="card">
      <h2>
        <CodeIcon />
        Code Analysis & Refactoring
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="code-input">
            Paste your code here for AI-powered analysis and refactoring suggestions:
          </label>
          <textarea
            id="code-input"
            className="textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste your code here...
function example() {
  console.log('Hello, world!');
}"
            rows={12}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || !code.trim()}
        >
          {loading ? (
            <>
              <div className="loading-spinner" />
              Analyzing Code...
            </>
          ) : (
            'Analyze & Refactor Code'
          )}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <AlertIcon />
          <span>Error: {error.message}</span>
        </div>
      )}

      {data && (
        <div className="result-section">
          <div className="result-header">
            <CheckIcon />
            <h3>Refactoring Suggestions</h3>
          </div>
          <div className="code-block">
            <code>{data.submitCode}</code>
          </div>
        </div>
      )}
    </div>
  );
}

function SimilarCodeFinder() {
  const [requestCode, setRequestCode] = useState('');
  const [getSimilarCode, { data, loading, error }] = useLazyQuery(GET_SIMILAR_CODE_QUERY);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (requestCode.trim()) {
      getSimilarCode({ variables: { code: requestCode } });
    }
  };

  return (
    <div className="card">
      <h2>
        <SearchIcon />
        Find Similar Code
      </h2>
      
      <form onSubmit={handleSearch}>
        <div className="form-group">
          <label className="form-label" htmlFor="search-input">
            Search for code snippets similar to yours:
          </label>
          <textarea
            id="search-input"
            className="textarea"
            value={requestCode}
            onChange={(e) => setRequestCode(e.target.value)}
            placeholder="// Paste code here to find similar snippets...
function search() {
  return 'example';
}"
            rows={8}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-secondary" 
          disabled={loading || !requestCode.trim()}
        >
          {loading ? (
            <>
              <div className="loading-spinner" />
              Searching...
            </>
          ) : (
            'Find Similar Code'
          )}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <AlertIcon />
          <span>Error finding similar code: {error.message}</span>
        </div>
      )}

      {data && data.getSimilarCode && data.getSimilarCode.length > 0 && (
        <div className="result-section">
          <div className="result-header">
            <CheckIcon />
            <h3>Similar Code Snippets ({data.getSimilarCode.length} found)</h3>
          </div>
          
          {data.getSimilarCode.map((snippet: string, index: number) => (
            <div key={index} className="similar-code-item">
              <div className="similar-code-header">
                Snippet {index + 1}
              </div>
              <div className="similar-code-content">
                <pre><code>{snippet}</code></pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.getSimilarCode && data.getSimilarCode.length === 0 && (
        <div className="result-section">
          <div className="success-message">
            <CheckIcon />
            <span>No similar code snippets found. Your code might be unique!</span>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <header className="header">
        <h1>AI Code Refactoring Engine</h1>
        <p>Enhance your code with AI-powered analysis and find similar patterns</p>
      </header>
      
      <main className="container">
        <div className="grid">
          <CodeAnalyzer />
          <SimilarCodeFinder />
        </div>
      </main>
    </div>
  );
}

const WrappedApp = () => (
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);

export default WrappedApp;

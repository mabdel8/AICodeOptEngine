import React from 'react';
import { useQuery, gql } from '@apollo/client';

const HELLO_QUERY = gql`
  query {
    hello
  }
`;

function App() {
  const { loading, error, data } = useQuery(HELLO_QUERY);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <div>
      <h2>{data.hello}</h2>
    </div>
  );
}

export default App;

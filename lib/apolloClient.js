import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const createApolloClient = () => {
  return new ApolloClient({
    link: new HttpLink({
      uri: 'your-endpoint', // Your GraphQL endpoint here
    }),
    cache: new InMemoryCache(),
  });
};

export const apolloClient = createApolloClient();
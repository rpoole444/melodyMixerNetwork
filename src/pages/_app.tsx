import type { AppProps } from 'next/app';
import { UserProvider } from '../contexts/UserContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import "../styles/globals.css";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <div className="min-h-screen bg-zinc-950">
          <Component {...pageProps} />
        </div>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default MyApp;

import type { AppProps } from 'next/app';
import { UserProvider } from '../contexts/UserContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import Head from "next/head";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "../styles/globals.css";

const queryClient = new QueryClient();
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display" });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <Head>
        <title>{`${BRAND.name} | ${BRAND.tagline}`}</title>
        <meta name="description" content={BRAND.description} />
        <meta name="theme-color" content="#15120f" />
        <meta property="og:title" content={BRAND.name} />
        <meta property="og:description" content={BRAND.description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/human-frequency-social.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/human-frequency-mark.svg" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <div className="min-h-screen bg-ink">
            <Component {...pageProps} />
          </div>
        </UserProvider>
      </QueryClientProvider>
    </div>
  );
}

export default MyApp;

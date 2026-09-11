import "../styles/globals.css";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/next";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f5f8f6" />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

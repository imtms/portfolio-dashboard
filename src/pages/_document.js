import { Html, Head, Main, NextScript } from "next/document";

const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem("portfolio-theme");
    var hasStored = stored === "dark" || stored === "light";
    var dark = hasStored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    var cs = document.querySelector('meta[name="color-scheme"]');
    if (cs) cs.content = hasStored ? stored : "light dark";
    var tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.content = dark ? "#070b12" : "#eef2f6";
  } catch (e) {}
})();
`;

export default function Document({ __NEXT_DATA__ }) {
  return (
    <Html lang={__NEXT_DATA__.page.startsWith("/articles") ? "zh-CN" : "en"}>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#eef2f6" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

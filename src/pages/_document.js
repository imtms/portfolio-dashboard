import { Html, Head, Main, NextScript } from "next/document";

const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem("portfolio-theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  } catch (e) {}
})();
`;

export default function Document({ __NEXT_DATA__ }) {
  return (
    <Html lang={__NEXT_DATA__.page.startsWith("/articles") ? "zh-CN" : "en"}>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

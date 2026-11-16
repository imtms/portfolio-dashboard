export const siteUrl = "https://www.mengshi.de";
export const siteName = "TMs Portfolio";

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).href;
}

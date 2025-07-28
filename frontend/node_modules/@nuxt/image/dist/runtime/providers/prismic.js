import { getQuery, withBase, withQuery } from "ufo";
import { operationsGenerator } from "./imgix.js";
import { getImage as getUnsplashImage, unsplashCDN } from "./unsplash.js";
export const prismicCDN = "https://images.prismic.io/";
export const getImage = (src, { modifiers = {}, baseURL = prismicCDN } = {}, ctx) => {
  if (src.startsWith(unsplashCDN)) {
    return getUnsplashImage(src, { modifiers }, ctx);
  }
  const operations = operationsGenerator(modifiers);
  return {
    url: withQuery(withBase(src, baseURL), getQuery("?" + operations))
  };
};

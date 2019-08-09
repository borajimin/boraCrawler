const axios = require("axios");
const cheerio = require("cheerio");
const URL = require("url-parse");

const START_URL = "https://www.youtube.com";

const pagesToVisit = [];
// const linksToVisit = [];
// const MAX_LINKS_TO_VISIT = 10;
const MAX_PAGES_TO_VISIT = 100;
const SEARCH_WORD = "spongebob";

const pagesVisited = new Set();
// let numLinksVisited = 0;
let numPagesVisited = 0;
const url = new URL(START_URL);
const baseUrl = `${url.protocol}//${url.hostname}`;

pagesToVisit.push(START_URL);

console.log("Searching for", SEARCH_WORD);

const collectLinks = $ => {
  const links = $("a[href^='/']");
  console.log(`${links.length} relative links found.`);
  links.each(l => {
    pagesToVisit.push(baseUrl + links[l].attribs.href);
  });
};

const searchForWord = ($, word) => {
  const bodyText = $("html > body")
    .text()
    .toLowerCase();
  return bodyText.indexOf(word) !== -1;
};

const visitPage = (page, callback) => {
  pagesVisited.add(page);
  numPagesVisited++;

  axios
    .get(page)
    .then(response => {
      if (response.status !== 200) {
        callback();
        return;
      } else {
        console.log(response.status, page);
        const $ = cheerio.load(response.data);
        const isWordFound = searchForWord($, SEARCH_WORD);
        if (isWordFound) {
          console.log(`The word ${SEARCH_WORD} has been found at ${page}`);
        } else {
          collectLinks($);
          callback();
        }
      }
    })
    .catch(error => {
      console.error(
        "Error",
        error.response.status,
        error.response.statusText,
        page
      );
      callback();
    });
};

const crawl = () => {
  if (numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Maximum links visited for this session");
    return;
  }
  const nextPage = pagesToVisit.pop();
  if (pagesVisited.has(nextPage)) {
    crawl();
  } else {
    visitPage(nextPage, crawl);
  }
};

crawl();

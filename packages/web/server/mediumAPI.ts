import { parse, validate } from 'fast-xml-parser'
import { Articles } from 'fullstack/ArticleProps'
import * as htmlToFormattedText from 'html-to-formatted-text'
import Sentry from '../fullstack/sentry'
import abortableFetch from '../src/utils/abortableFetch'
interface JSONRSS {
  rss: {
    channel: {
      item: JSONRSSItem[]
      description: string
      image: { url: string; title: string; link: string }
      lastBuildDate: string
    }
  }
}

interface JSONRSSItem {
  'atom:updated': string
  category: string[]
  'content:encoded': string
  guid: string
  link: string
  pubDate: string
  title: string
}

function getFirstImgURL(htmlstring: string) {
  return htmlstring
    .split('<img')[1]
    .split('src=')[1]
    .split('"')[1]
}

// @param htmlstring - a string of valid html with at least one p element
// @return a string of plain text which assumes that
// A) paragraphs represent gramatically valid stopping points and
// B) the '.' character will be use to end a sentence more often than its other uses
// the result is an excerpt that is likely to be no more than 320 characters long while retaining readability
function getGramaticallyCorrectExcerpt(htmlstring: string) {
  const charsInClosingTag = 4
  const approximateMaxChars = 320
  const firstParagraph = htmlstring.substring(
    htmlstring.indexOf('<p'),
    htmlstring.indexOf('</p>') + charsInClosingTag
  )
  // remove any links or emphasis tags etc
  const plainText = htmlToFormattedText(firstParagraph).replace('&amp;', '&')

  // ensure it is a reasonable length
  return plainText.length > approximateMaxChars
    ? plainText.substring(0, plainText.indexOf('. ') + 1)
    : plainText
}

function transform(items: JSONRSSItem[]) {
  return items.slice(0, 3).map((item) => {
    return {
      title: item.title,
      href: item.link,
      imgSource: getFirstImgURL(item['content:encoded']),
      text: getGramaticallyCorrectExcerpt(item['content:encoded']),
    }
  })
}

function parseXML(xmlData: string): JSONRSSItem[] {
  if (validate(xmlData) === true) {
    const jsonRSS: JSONRSS = parse(xmlData, {})
    return jsonRSS.rss.channel.item
  } else {
    return []
  }
}

async function fetchMediumArticles(): Promise<string> {
  const response = (await abortableFetch('https://medium.com/feed/celohq')) as Response
  return response.text()
}

export async function getFormattedMediumArticles(): Promise<Articles> {
  try {
    const xmlString = await fetchMediumArticles()
    const articles = transform(parseXML(xmlString))
    return { articles }
  } catch (e) {
    Sentry.withScope((scope) => {
      scope.setTag('Service', 'Medium')
      Sentry.captureException(e)
    })
    return { articles: [] }
  }
}

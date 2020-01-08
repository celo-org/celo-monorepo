import { parse, validate } from 'fast-xml-parser'
import { Articles } from 'fullstack/ArticleProps'
import htmlToFormattedText from 'html-to-formatted-text'
import cache from '../server/cache'
import Sentry from '../server/sentry'
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
  try {
    return htmlstring
      .split('<img')[1]
      .split('src=')[1]
      .split('"')[1]
  } catch (e) {
    console.error(e)
  }
}

// @param htmlstring - a string of valid html with at least one p element
// @return a string of plain text which assumes that
// A) paragraphs represent gramatically valid stopping points and
// B) the '.' character will be use to end a sentence more often than its other uses
// the result is an excerpt that is likely to be no more than 320 characters long while retaining readability
function getGramaticallyCorrectExcerpt(htmlstring: string) {
  try {
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
  } catch (e) {
    console.error(e)
  }
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

async function getAndTransform() {
  const xmlString = await fetchMediumArticles()
  return transform(parseXML(xmlString))
}

export async function getFormattedMediumArticles(): Promise<Articles> {
  try {
    const articles = await cache('medium-blog', getAndTransform)
    return { articles }
  } catch (e) {
    Sentry.withScope((scope) => {
      scope.setTag('Service', 'Medium')
      Sentry.captureException(e)
    })
    return { articles: [] }
  }
}

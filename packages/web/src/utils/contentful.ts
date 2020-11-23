import { Document } from '@contentful/rich-text-types'
import { Asset, createClient, Entry, EntryCollection } from 'contentful'
import getConfig from 'next/config'
import { Page as SideBarEntry } from 'src/experience/common/Sidebar'

function intialize() {
  const { serverRuntimeConfig, publicRuntimeConfig } = getConfig()
  const isPreview = publicRuntimeConfig.ENV === 'development'
  return createClient({
    space: serverRuntimeConfig.CONTENTFUL_SPACE_ID,
    accessToken: isPreview
      ? serverRuntimeConfig.CONTENTFUL_PREVIEW_ACCESS_TOKEN
      : serverRuntimeConfig.CONTENTFUL_ACCESS_TOKEN,
    host: isPreview ? 'preview.contentful.com' : undefined,
  })
}

interface Kit {
  name: string
  slug: string
  metaDescription: string
  ogImage: Asset
  pages_: any[]
}

interface InternalKit {
  kitName: string
  metaDescription: string
  ogImage: Asset
  pageID: string
  sidebar: SideBarEntry[]
}

export async function getKit(kitSlug: string, pageSlug: string, { locale }): Promise<InternalKit> {
  const kit = await intialize().getEntries<Kit>({
    content_type: 'kit',
    'fields.slug': kitSlug,
    locale,
  })

  const data = kit.items[0].fields

  const homePageSlug = kitSlug === 'merchant' ? 'index' : kitSlug

  const actualPageSlug = !pageSlug ? homePageSlug : pageSlug

  const pageID = data.pages_.find((p) => p.fields.slug === actualPageSlug)?.sys?.id

  return {
    kitName: data.name,
    metaDescription: data.metaDescription,
    ogImage: data.ogImage,
    pageID,
    sidebar: data.pages_.map((page) => {
      return {
        title: page.fields.title,
        href: `/experience/${kitSlug}${
          page.fields.slug === kitSlug || page.fields.slug === 'index' ? '' : '/' + page.fields.slug
        }${addLocale(locale)}`,
        sections: [],
      }
    }),
  }
}

interface ContentFulPage {
  title: string
  slug: string
  sections: Array<Entry<{ name: string; contentField: Document; slug: string }>>
}

export async function getPageBySlug(slug: string, { locale }) {
  const pages = await intialize().getEntries<ContentFulPage>({
    content_type: 'page',
    'fields.slug': slug,
    include: 3,
    locale,
  })
  return processPages(pages)
}

export async function getPageById(id: string, { locale }) {
  const pages = await intialize().getEntries<ContentFulPage>({
    content_type: 'page',
    'sys.id': id,
    include: 3,
    locale,
  })
  return processPages(pages)
}

function processPages(pages: EntryCollection<ContentFulPage>) {
  const data = pages.items[0].fields
  const sections = (data.sections || []).map((section) => section.fields)
  return { ...data, sections, updatedAt: pages.items[0].sys.updatedAt }
}

export function addLocale(locale) {
  if (locale === 'en-US') {
    return ''
  } else {
    return `?locale=${locale}`
  }
}

interface FAQItem {
  question: string
  answer: Document
}

interface FAQcollection {
  title: string
  list: Array<Entry<FAQItem>>
}

export async function getFAQ({ locale }) {
  const result = await intialize().getEntries<FAQcollection>({
    locale,
    content_type: 'faq',
    include: 3,
    'fields.key': 'celoFAQ',
  })
  const faqPage = result.items[0]
  return faqPage
}

import { Document } from '@contentful/rich-text-types'
import { Asset, createClient, Entry } from 'contentful'
import getConfig from 'next/config'
import { Page as SideBarEntry } from 'src/experience/common/Sidebar'

function intialize(preview: boolean) {
  const { serverRuntimeConfig } = getConfig()

  return createClient({
    space: serverRuntimeConfig.CONTENTFUL_SPACE_ID,
    accessToken: preview
      ? serverRuntimeConfig.CONTENTFUL_PREVIEW_ACCESS_TOKEN
      : serverRuntimeConfig.CONTENTFUL_ACCESS_TOKEN,
    host: preview ? 'preview.contentful.com' : undefined,
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

export async function getKit(
  kitSlug: string,
  pageSlug: string,
  { preview, locale }
): Promise<InternalKit> {
  const kit = await intialize(preview).getEntries<Kit>({
    content_type: 'kit',
    'fields.slug': kitSlug,
    locale,
  })

  const data = kit.items[0].fields
  const pageID = data.pages_.find((p) => p.fields.slug === (!pageSlug ? 'index' : pageSlug))?.sys
    ?.id
  return {
    kitName: data.name,
    metaDescription: data.metaDescription,
    ogImage: data.ogImage,
    pageID,
    sidebar: data.pages_.map((page) => {
      return {
        title: page.fields.title,
        href: `/experience/${kitSlug}${
          page.fields.slug === 'index' ? '' : '/' + page.fields.slug
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

export async function getPage(pageSlug: string, id, { preview, locale }) {
  const pages = await intialize(preview).getEntries<ContentFulPage>({
    content_type: 'page',
    'fields.slug': !pageSlug ? 'index' : pageSlug,
    'sys.id': id,
    include: 3,
    locale,
  })

  const data = pages.items[0].fields

  const sections = data.sections.map((section) => section.fields)
  return { ...data, sections }
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

export async function getFAQ({ preview = true, locale }) {
  const result = await intialize(preview).getEntries<FAQcollection>({
    locale,
    content_type: 'faq',
    include: 3,
    'fields.key': 'celoFAQ',
  })
  const faqPage = result.items[0]
  return faqPage
}

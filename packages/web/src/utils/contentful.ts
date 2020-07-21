import { createClient, Entry, Asset } from 'contentful'
import getConfig from 'next/config'
import { Page as SideBarEntry } from 'src/experience/common/Sidebar'
import { Document } from '@contentful/rich-text-types'

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

function getClient(preview: boolean) {
  return intialize(preview)
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
  sidebar: SideBarEntry[]
}

export async function getKit(kitSlug: string, { preview, locale }): Promise<InternalKit> {
  const kit = await getClient(preview).getEntries<Kit>({
    content_type: 'kit',
    'fields.slug': kitSlug,
    locale,
  })

  const data = kit.items[0].fields

  return {
    kitName: data.name,
    metaDescription: data.metaDescription,
    ogImage: data.ogImage,
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

export async function getPage(pageSlug: string, { preview, locale }) {
  const page = await getClient(preview).getEntries<ContentFulPage>({
    content_type: 'page',
    'fields.slug': !pageSlug ? 'index' : pageSlug,
    include: 3,
    locale,
  })

  const data = page.items[0].fields

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

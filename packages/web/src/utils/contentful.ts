import { createClient, Entry } from 'contentful'
import getConfig from 'next/config'
import { Page as SideBarEntry } from 'src/experience/common/Sidebar'

function intialize(preview) {
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

interface Page {
  title: string
  slug: string
  sections: any[]
}

export default async function demo() {
  console.warn('TEST')
  const slug = 'welcome'

  const pages = await getClient(false).getEntries<Page>({
    content_type: 'page',
    'fields.slug': slug,
  })

  const page = pages.items[0].fields

  console.warn(page.title, page.sections)
  return {
    name: page.title,
    sections: page.sections,
  }
}

interface Kit {
  name: string
  slug: string
  metaDescription: string
  ogImage: object
  pages_: any[]
}

interface InternalKit {
  kitName: string
  metaDescription: string
  ogImage: object
  sidebar: SideBarEntry[]
}

export async function getKit(kitSlug: string): Promise<InternalKit> {
  const kit = await getClient(false).getEntries<Kit>({
    content_type: 'kit',
    'fields.slug': kitSlug,
  })

  const data = kit.items[0].fields

  return {
    kitName: data.name,
    metaDescription: data.metaDescription,
    ogImage: data.ogImage,
    sidebar: data.pages_.map((page) => {
      return {
        title: page.fields.title,
        href: `/experience/${kitSlug}${page.fields.slug === 'index' ? '' : '/' + page.fields.slug}`,
        sections: [],
      }
    }),
  }
}

interface ContentFulPage {
  title: string
  slug: string
  sections: Array<Entry<{ name: string; contentField: object; slug: string }>>
}

export async function getPage(pageSlug: string) {
  const page = await getClient(false).getEntries<ContentFulPage>({
    content_type: 'page',
    'fields.slug': !pageSlug ? 'index' : pageSlug,
    include: 3,
  })

  const data = page.items[0].fields

  const sections = data.sections.map((section) => section.fields)
  return { ...data, sections }
}

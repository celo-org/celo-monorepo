import { createClient } from 'contentful'
import getConfig from 'next/config'
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

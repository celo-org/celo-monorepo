import * as React from 'react'
import Page from 'src/experienceKits/common/Page'
import menu, { hashNav } from 'src/shared/menu-items'

export const ROOT = menu.BRAND.link

export const FLAVOR_PATH = `${ROOT}/logo`

const PAGES = [
  {
    title: 'Introduction',
    href: ROOT,
    sections: [
      { title: 'Overview', href: `${ROOT}#${hashNav.eventsIntro.overview}` },
      { title: 'Brand Voice', href: `${ROOT}#${hashNav.eventsIntro.brandVoice}` },
    ],
  },
  {
    title: 'Celo Flavor',
    href: FLAVOR_PATH,
    sections: [
      { title: 'Community Tenets', href: `${ROOT}#${hashNav.eventsIntro.overview}` },
      { title: 'Community Coe of Conduct', href: `${ROOT}#${hashNav.eventsIntro.brandVoice}` },
    ],
  },
]

export const ROUTE_TO_TITLE = PAGES.reduce((mapping, page) => {
  mapping[page.href] = page.title
  return mapping
}, {})

interface Section {
  id: string
  children: React.ReactNode
}

interface Props {
  sections: Section[]
  title: string
  path: string
  metaDescription: string
}

export default function BrandKitPage({ sections, title, path, metaDescription }: Props) {
  return (
    <Page
      pages={PAGES}
      sections={sections}
      title={`EventsKit / ${title}`}
      path={path}
      metaDescription={metaDescription}
      ogImage={require('src/experienceKits/brandkit/images/ogimage-brandkit.png')}
    />
  )
}

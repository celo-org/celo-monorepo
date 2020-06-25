import * as React from 'react'
import Page from 'src/experience/common/Page'
import menu, { hashNav } from 'src/shared/menu-items'

export const ROOT = menu.BRAND.link

export const LOGO_PATH = `${ROOT}/logo`

export const COLOR_PATH = `${ROOT}/color`

export const TYPE_PATH = `${ROOT}/typography`

export const IMAGERY_PATH = `${ROOT}/key-imagery`
export const ICONS_PATH = `${ROOT}/icons`
export const EXCHANGE_ICONS_PATH = `${ROOT}/exchange-icons`
export const COMPOSITION_PATH = `${ROOT}/composition`

const PAGES = [
  {
    title: 'Introduction',
    href: ROOT,
    sections: [
      { title: 'Overview', href: `${ROOT}#${hashNav.brandIntro.overview}` },
      { title: 'Brand Voice', href: `${ROOT}#${hashNav.brandIntro.brandVoice}` },
    ],
  },
  {
    title: 'Logo',
    href: LOGO_PATH,

    sections: [
      { title: 'Overview', href: `${LOGO_PATH}#${hashNav.brandLogo.overview}` },
      { title: 'Space and Sizing', href: `${LOGO_PATH}#${hashNav.brandLogo.space}` },
      { title: 'Backgrounds', href: `${LOGO_PATH}#${hashNav.brandLogo.backgrounds}` },
    ],
  },
  {
    title: 'Color',
    href: COLOR_PATH,

    sections: [
      { title: 'Overview', href: `${COLOR_PATH}#${hashNav.brandColor.overview}` },
      { title: 'Background Colors', href: `${COLOR_PATH}#${hashNav.brandColor.backgrounds}` },
    ],
  },
  {
    title: 'Typography',
    href: TYPE_PATH,

    sections: [
      { title: 'Overview', href: `${TYPE_PATH}#${hashNav.brandTypography.overview}` },
      { title: 'Type Scale', href: `${TYPE_PATH}#${hashNav.brandTypography.scale}` },
    ],
  },
  {
    title: 'Composition',
    href: COMPOSITION_PATH,

    sections: [
      { title: 'Overview', href: `${COMPOSITION_PATH}#${hashNav.brandComposition.overview}` },
      { title: 'The Grid', href: `${COMPOSITION_PATH}#${hashNav.brandComposition.grid}` },
    ],
  },
  {
    title: 'Exchange Icons',
    href: EXCHANGE_ICONS_PATH,
    sections: [],
  },
  {
    title: 'Icons',
    href: ICONS_PATH,
    sections: [],
  },
  {
    title: 'Key Imagery',
    href: IMAGERY_PATH,

    sections: [
      { title: 'Overview', href: `${IMAGERY_PATH}#${hashNav.brandImagery.overview}` },
      { title: 'Illustrations', href: `${IMAGERY_PATH}#${hashNav.brandImagery.illustrations}` },
      { title: 'Abstract Graphics', href: `${IMAGERY_PATH}#${hashNav.brandImagery.graphics}` },
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
      title={`BrandKit / ${title}`}
      path={path}
      metaDescription={metaDescription}
      ogImage={require('src/experience/brandkit/images/ogimage-brandkit.png')}
    />
  )
}

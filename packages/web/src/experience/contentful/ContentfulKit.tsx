import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { Document } from '@contentful/rich-text-types'
import * as React from 'react'
import Page from 'src/experience/common/Page'

import { Page as SideBarEntry } from 'src/experience/common/Sidebar'
import { renderNode } from './nodes'

export interface Props {
  kitName: string
  metaDescription: string
  path: string
  ogImage: string
  sidebar: SideBarEntry[]
  sections: Array<{
    name: string
    contentField: Document
    slug: string
  }>
}

const OPTIONS = {
  renderNode,
}

export default function ContentfulKit({
  kitName,
  metaDescription,
  path,
  sidebar,
  sections,
  ogImage,
}: Props) {
  const children = sections.map((section) => {
    return {
      id: section.slug,
      children: documentToReactComponents(section.contentField, OPTIONS),
    }
  })

  return (
    <Page
      pages={sidebar}
      sections={children}
      title={`${kitName}`}
      kitName={kitName}
      path={`/experience/${path}`}
      metaDescription={metaDescription}
      ogImage={ogImage}
    />
  )
}

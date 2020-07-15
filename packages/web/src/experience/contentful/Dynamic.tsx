import * as React from 'react'
import Page from 'src/experience/common/Page'
// import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { Page as SideBarEntry } from 'src/experience/common/Sidebar'

import { View } from 'react-native'

export interface Props {
  kitName: string
  metaDescription: string
  path: string
  sidebar: SideBarEntry[]
  sections: object
}

export default function DynamicKit({ kitName, metaDescription, path, sidebar }: Props) {
  return (
    <Page
      pages={sidebar}
      sections={[{ id: 'fake', children: <View /> }]}
      title={`${kitName}`}
      kitName={kitName}
      path={path}
      metaDescription={metaDescription}
      ogImage={require('src/experience/brandkit/images/ogimage-brandkit.png')}
    />
  )
}

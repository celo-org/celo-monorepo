import * as React from 'react'
import Page from 'src/experience/common/Page'
// import { documentToReactComponents } from '@contentful/rich-text-react-renderer'

import { View } from 'react-native'

interface Props {
  name: string
  metaDescription: string
  path: string
  sidebar: any
}

export default function DynamicKit({ name, metaDescription, path, sidebar }: Props) {
  return (
    <Page
      pages={sidebar}
      sections={[{ id: 'fake', children: <View /> }]}
      title={`${name}`}
      path={path}
      metaDescription={metaDescription}
      ogImage={require('src/experience/brandkit/images/ogimage-brandkit.png')}
    />
  )
}

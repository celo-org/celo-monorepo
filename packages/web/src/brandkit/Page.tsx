import * as React from 'react'
import { View } from 'react-native'
import Sidebar from 'src/brandkit/Sidebar'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { standardStyles, colors } from 'src/styles'

const PAGES = [
  {
    title: 'Introduction',
    href: '/brand',
    active: false,
    sections: [],
  },
  {
    title: 'Logo',
    href: '/brand',
    active: true,
    sections: [
      { title: 'Overview', active: true, href: '/brand' },
      { title: 'Glyph', active: false, href: '/brand' },
      { title: 'Wordmark', active: false, href: '/brand' },
      { title: 'Guidlines', active: false, href: '/brand' },
    ],
  },
  {
    title: 'Color',
    href: '/brand',
    active: false,
    sections: [{ title: 'Overview', active: false, href: '/brand' }],
  },
  {
    title: 'Typography',
    href: '/brand',
    active: false,
    sections: [{ title: 'Overview', active: false, href: '/brand' }],
  },
  {
    title: 'Key Imagery',
    href: '/brand',
    active: false,
    sections: [],
  },
]

export default React.memo(function Page() {
  return (
    <View>
      <GridRow allStyle={standardStyles.sectionMarginTop}>
        <Cell span={Spans.fourth}>
          <Sidebar pages={PAGES} />
        </Cell>
        <Cell span={Spans.three4th}>
          <View style={{ backgroundColor: colors.lightBlue, minHeight: 'calc(100vh - 500px)' }}>
            {}
          </View>
        </Cell>
      </GridRow>
    </View>
  )
})

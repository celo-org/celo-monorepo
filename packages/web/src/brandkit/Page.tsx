import * as React from 'react'
import { Text, View } from 'react-native'
import Sidebar from 'src/brandkit/Sidebar'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { colors, standardStyles } from 'src/styles'
import Topbar from 'src/brandkit/TopBar'
import { SingletonRouter, withRouter } from 'next/router'
import { withScreenSize, ScreenProps, ScreenSizes } from 'src/layout/ScreenSize'

import MobileMenu from 'src/brandkit/MobileMenu'

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

interface Props {
  router: SingletonRouter
}

export default withScreenSize(
  withRouter(
    React.memo(function Page({ router, screen }: Props & ScreenProps) {
      const isMobile = screen === ScreenSizes.MOBILE
      return (
        <View style={{ isolation: 'isolate' }}>
          <Topbar />
          {isMobile && <MobileMenu pages={PAGES} pathname={router.pathname} />}
          <GridRow mobileStyle={{ zIndex: -5 }}>
            <Cell span={Spans.fourth}>{!isMobile && <Sidebar pages={PAGES} />}</Cell>
            <Cell span={Spans.three4th}>
              <View style={{ minHeight: 'calc(100vh - 500px)' }}>
                <Text>{router.pathname}</Text>
              </View>
            </Cell>
          </GridRow>
        </View>
      )
    })
  )
)

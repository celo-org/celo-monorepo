import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Sidebar from 'src/brandkit/Sidebar'
import Footer from 'src/shared/Footer.3'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Topbar from 'src/brandkit/TopBar'
import { SingletonRouter, withRouter } from 'next/router'
import { withScreenSize, ScreenProps, ScreenSizes } from 'src/layout/ScreenSize'
import { colors } from 'src/styles'

import MobileMenu from 'src/brandkit/MobileMenu'
import { HEADER_HEIGHT } from 'src/shared/Styles'

const PAGES = [
  {
    title: 'Introduction',
    href: '/brand',
    sections: [],
  },
  {
    title: 'Logo',
    href: '/brand/logo',

    sections: [
      { title: 'Overview', href: '/brand/logo#overview' },
      { title: 'Glyph', href: '/brand/logo#glyph' },
      { title: 'Wordmark', href: '/brand/logo#wordmark' },
      { title: 'Guidlines', href: '/brand/logo#guidelines' },
    ],
  },
  {
    title: 'Color',
    href: '/brand/color',

    sections: [{ title: 'Overview', href: '/brand/color#overview' }],
  },
  {
    title: 'Typography',
    href: '/brand/typography',

    sections: [{ title: 'Overview', href: '/brand/typography#overview' }],
  },
  {
    title: 'Key Imagery',
    href: '/brand/key-imagery',

    sections: [],
  },
]

interface Props {
  router: SingletonRouter
  children: React.ReactNode
}

interface State {
  routeHash: string
}

class Page extends React.Component<Props & ScreenProps, State> {
  state: State = {
    routeHash: '',
  }

  onChangeHash = () => {
    this.setState({ routeHash: window.location.hash })
  }

  componentDidMount = () => {
    this.onChangeHash()
    window.addEventListener('hashchange', this.onChangeHash, false)
  }

  componentWillUnmount = () => {
    window.removeEventListener('hashchange', this.onChangeHash)
  }

  render() {
    const { screen, children, router } = this.props
    const isMobile = screen === ScreenSizes.MOBILE
    return (
      <View style={styles.conatiner}>
        <View
          style={{
            position: 'fixed',
            width: '100%',
            borderBottomColor: colors.gray,
            zIndex: 10,
          }}
        >
          <Topbar />
        </View>
        <View style={{ marginTop: 70 }} />
        {isMobile && (
          <MobileMenu pages={PAGES} pathname={router.pathname} routeHash={this.state.routeHash} />
        )}
        <GridRow mobileStyle={styles.mobileMain}>
          <Cell span={Spans.fourth}>
            {!isMobile && (
              <Sidebar
                pages={PAGES}
                currentPathName={router.pathname}
                routeHash={this.state.routeHash}
              />
            )}
          </Cell>
          <Cell span={Spans.three4th}>
            <View style={styles.childrenArea}>
              <Text>{this.state.routeHash}</Text>
              {children}
            </View>
          </Cell>
        </GridRow>
        <View style={styles.footer}>
          <Footer />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  // @ts-ignore creates a stacking context
  conatiner: { isolation: 'isolate' },
  mobileMain: { zIndex: -5 },
  footer: { zIndex: -10 },
  childrenArea: { minHeight: `calc(100vh - ${HEADER_HEIGHT + 100}px)` },
})

export default withScreenSize(withRouter(Page))

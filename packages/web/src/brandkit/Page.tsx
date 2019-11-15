import * as React from 'react'
import { StyleSheet, Text, View, findNodeHandle } from 'react-native'
import Sidebar from 'src/brandkit/Sidebar'
import Footer from 'src/shared/Footer.3'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Topbar from 'src/brandkit/TopBar'
import { SingletonRouter, withRouter } from 'next/router'
import { withScreenSize, ScreenProps, ScreenSizes } from 'src/layout/ScreenSize'
import { colors, standardStyles } from 'src/styles'

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

interface Section {
  id: string
  children: React.ReactNode
}

interface Props {
  router: SingletonRouter
  sections: Section[]
}

interface State {
  routeHash: string
}

class Page extends React.Component<Props & ScreenProps, State> {
  state: State = {
    routeHash: '',
  }

  ratios: Record<string, { id: string; ratio: number; top: number }> = {}

  observer: IntersectionObserver

  pageRef = React.createRef<View>()

  sectionRefs = this.props.sections.reduce((acc, section) => {
    acc[section.id] = React.createRef<View>()
    return acc
  }, {})

  onChangeHash = () => {
    this.setState({ routeHash: window.location.hash })
  }

  onIntersection = (entries: IntersectionObserverEntry[]) => {
    this.ratios = entries
      .map((entry) => ({
        id: entry.target.id,
        ratio: entry.intersectionRatio,
        top: entry.boundingClientRect.top,
      }))
      .reduce((acc, currentValue) => {
        acc[currentValue.id] = currentValue
        return acc
      }, this.ratios)

    const top = Object.keys(this.ratios)
      .map((key) => this.ratios[key])
      .reduce(
        (acc, current) => {
          if (current.ratio > acc.ratio) {
            return current
          }
          return acc
        },
        { ratio: 0, id: this.state.routeHash }
      )

    if (this.state.routeHash !== top.id) {
      this.setState({ routeHash: top.id })
      window.history.replaceState({}, top.id, `${location.pathname}#${top.id}`)
    }
  }

  observation = () => {
    this.observer = new IntersectionObserver(this.onIntersection, {
      // root: findNodeHandle(this.pageRef.current) as any,
      // rootMargin: `200px`,
      threshold: [0.1, 0.5, 0.9, 1],
    })

    Object.keys(this.sectionRefs).forEach((id) => {
      const value = this.sectionRefs[id]
      // findNodeHandle is typed to return a number but returns an Element
      const element = (findNodeHandle(value.current) as unknown) as Element
      this.observer.observe(element)
    })
  }

  componentDidMount = () => {
    this.observation()

    window.addEventListener('hashchange', this.onChangeHash, false)
  }

  componentWillUnmount = () => {
    this.observer.disconnect()
    window.removeEventListener('hashchange', this.onChangeHash)
  }

  render() {
    const { screen, sections, router } = this.props
    const isMobile = screen === ScreenSizes.MOBILE
    return (
      <View style={styles.conatiner} ref={this.pageRef}>
        <View style={styles.topbar}>
          <Topbar />
        </View>
        <View style={{ marginTop: 70 }} />
        {isMobile && (
          <MobileMenu pages={PAGES} pathname={router.pathname} routeHash={this.state.routeHash} />
        )}
        <GridRow
          mobileStyle={styles.mobileMain}
          desktopStyle={[styles.desktopMain, standardStyles.sectionMarginTop]}
        >
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
            <View style={styles.childrenArea} ref={this.pageRef}>
              <Text>{this.state.routeHash}</Text>
              {sections.map(({ id, children }) => {
                return (
                  <View
                    key={id}
                    nativeID={id}
                    ref={this.sectionRefs[id]}
                    style={standardStyles.blockMargin}
                  >
                    {children}
                  </View>
                )
              })}
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
  desktopMain: {},
  topbar: {
    position: 'fixed',
    width: '100%',
    borderBottomColor: colors.gray,
    zIndex: 10,
  },
  footer: { zIndex: -10 },
  childrenArea: { minHeight: `calc(100vh - ${HEADER_HEIGHT + 70}px)` },
})

export default withScreenSize(withRouter(Page))

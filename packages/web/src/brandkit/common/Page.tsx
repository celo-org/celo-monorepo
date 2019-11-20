import { SingletonRouter, withRouter } from 'next/router'
import * as React from 'react'
import { findNodeHandle, StyleSheet, View } from 'react-native'
import MobileMenu from 'src/brandkit/common/MobileMenu'
import Sidebar from 'src/brandkit/common/Sidebar'
import Topbar from 'src/brandkit/common/TopBar'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Footer from 'src/shared/Footer.3'
import menu, { hashNav } from 'src/shared/menu-items'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles } from 'src/styles'

const ROOT = menu.BRAND.link

const LOGO_PATH = `${ROOT}/logo`

const COLOR_PATH = `${ROOT}/color`

const TYPE_PATH = `${ROOT}/typography`

const IMAGERY_PATH = `${ROOT}/key-imagery`

const PAGES = [
  {
    title: 'Introduction',
    href: ROOT,
    sections: [],
  },
  {
    title: 'Logo',
    href: LOGO_PATH,

    sections: [
      { title: 'Overview', href: `${LOGO_PATH}#${hashNav.brandLogo.overview}` },
      // { title: 'Glyph', href: `${LOGO_PATH}#${hashNav.brandLogo.glyph}` },
      { title: 'Clearspace', href: `${LOGO_PATH}#${hashNav.brandLogo.clearspace}` },
      // { title: 'Size', href: `${LOGO_PATH}#${hashNav.brandLogo.size}` },
      { title: 'Backgrounds', href: `${LOGO_PATH}#${hashNav.brandLogo.backgrounds}` },
    ],
  },
  {
    title: 'Color',
    href: COLOR_PATH,

    sections: [
      { title: 'Overview', href: `${COLOR_PATH}#${hashNav.brandColor.overview}` },
      { title: 'Color System', href: `${COLOR_PATH}#${hashNav.brandColor.system}` },
      // { title: 'Guideline', href: `${COLOR_PATH}#${hashNav.brandColor.guideline}` },
    ],
  },
  {
    title: 'Typography',
    href: TYPE_PATH,

    sections: [
      { title: 'Overview', href: `${TYPE_PATH}#${hashNav.brandTypography.overview}` },
      { title: 'Color System', href: `${TYPE_PATH}#${hashNav.brandTypography.system}` },
      { title: 'Guideline', href: `${TYPE_PATH}#${hashNav.brandTypography.guideline}` },
    ],
  },
  {
    title: 'Key Imagery',
    href: IMAGERY_PATH,

    sections: [
      { title: 'Overview', href: `${IMAGERY_PATH}#${hashNav.brandImagery.overview}` },
      { title: 'Icons', href: `${IMAGERY_PATH}#${hashNav.brandImagery.icons}` },
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
              {sections.map(({ id, children }) => {
                return (
                  <View
                    key={id}
                    nativeID={id}
                    ref={this.sectionRefs[id]}
                    style={standardStyles.blockMarginBottom}
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
  conatiner: { transform: 'isolate' },
  mobileMain: { zIndex: -5, marginTop: 50 },
  desktopMain: {},
  topbar: {
    position: 'fixed',
    width: '100%',
    borderBottomColor: colors.gray,
    zIndex: 10,
  },
  footer: { zIndex: -10, backgroundColor: colors.white },
  childrenArea: {
    minHeight: `calc(100vh - ${HEADER_HEIGHT + 70}px)`,
  },
})

export default withScreenSize(withRouter(Page))

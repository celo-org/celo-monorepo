import throttle from 'lodash.throttle'
import { SingletonRouter, withRouter } from 'next/router'
import * as React from 'react'
import { findNodeHandle, StyleSheet, View } from 'react-native'
import MobileMenu from 'src/brandkit/common/MobileMenu'
import Sidebar from 'src/brandkit/common/Sidebar'
import Topbar from 'src/brandkit/common/TopBar'
import OpenGraph from 'src/header/OpenGraph'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Footer from 'src/shared/Footer'
import menu, { hashNav } from 'src/shared/menu-items'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles } from 'src/styles'

const FOOTER_ID = 'experience-footer'
const DISTANCE_TO_HIDE_AT = 25
const THROTTLE_SCROLL_MS = 200
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

const THAW_DISTANCE = 600

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
  title: string
  path: string
  metaDescription: string
}

interface State {
  routeHash: string
  isSidebarFrozen: boolean
  distanceToTop: number
  isLineVisible: boolean
}

class Page extends React.Component<Props & ScreenProps, State> {
  state: State = {
    routeHash: '',
    isSidebarFrozen: true,
    distanceToTop: 0,
    isLineVisible: false,
  }

  ratios: Record<string, { id: string; ratio: number; top: number }> = {}

  observer: IntersectionObserver

  footer = React.createRef<View>()

  sectionRefs = this.props.sections.reduce((acc, section) => {
    acc[section.id] = React.createRef<View>()
    return acc
  }, {})

  onChangeHash = () => {
    this.setState({ routeHash: window.location.hash })
  }

  updateSectionHashWhenInView = (entries: IntersectionObserverEntry[]) => {
    const filteredEntries = entries.filter(({ target }) => target.id !== FOOTER_ID)
    this.ratios = filteredEntries
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
    if (this.props.screen === ScreenSizes.MOBILE) {
      return
    }
    setImmediate(() => {
      const footer = entries.find((entry) => entry.target.id === FOOTER_ID)
      if (footer) {
        if (footer.boundingClientRect.top < THAW_DISTANCE) {
          this.setState({
            isSidebarFrozen: false,
            distanceToTop: footer.boundingClientRect.top - THAW_DISTANCE,
          })
        } else {
          this.setState({
            isSidebarFrozen: true,
          })
        }
      } else {
        this.setState({ isSidebarFrozen: true })
      }
    })
  }

  createSectionObservers = () => {
    if (!('IntersectionObserver' in window)) {
      return
    }
    this.observer = new IntersectionObserver(this.updateSectionHashWhenInView, {
      threshold: [0.1, 0.5, 0.9, 1],
    })

    Object.keys(this.sectionRefs).forEach((id) => {
      const value = this.sectionRefs[id]
      this.observeRef(value)
    })

    this.observeRef(this.footer)
  }

  observeRef = (ref: React.RefObject<View>) => {
    // findNodeHandle is typed to return a number but returns an Element
    const element = (findNodeHandle(ref.current) as unknown) as Element

    this.observer.observe(element)
  }

  componentDidMount = () => {
    this.createSectionObservers()
    if (this.props.screen !== ScreenSizes.MOBILE) {
      this.setLineVisibilityViaScroll()
    }
    window.addEventListener('hashchange', this.onChangeHash, false)
  }

  setLineVisibilityViaScroll = () => {
    window.addEventListener(
      'scroll',
      throttle((event) => {
        const top = event.target.scrollingElement.scrollTop + DISTANCE_TO_HIDE_AT
        if (top > HEADER_HEIGHT) {
          this.setState({ isLineVisible: true })
        } else {
          this.setState({ isLineVisible: false })
        }
      }, THROTTLE_SCROLL_MS)
    )
  }

  componentWillUnmount = () => {
    this.observer.disconnect()
    window.removeEventListener('hashchange', this.onChangeHash)
  }

  render() {
    const { screen, sections, router, path, metaDescription, title } = this.props
    const isMobile = screen === ScreenSizes.MOBILE
    return (
      <>
        <OpenGraph
          title={`Celo Experience / BrandKit / ${title}`}
          path={path}
          description={metaDescription}
          image={require('src/brandkit/images/ogimage-brandkit.png')}
        />
        <View style={styles.conatiner}>
          <View style={[styles.topbar, (this.state.isLineVisible || isMobile) && styles.grayLine]}>
            <Topbar isMobile={isMobile} />
          </View>
          <View style={styles.justNeedSpace} />
          {isMobile && (
            <MobileMenu pages={PAGES} pathname={router.pathname} routeHash={this.state.routeHash} />
          )}
          <GridRow mobileStyle={styles.mobileMain} desktopStyle={standardStyles.sectionMarginTop}>
            <Cell span={Spans.fourth} style={styles.sidebar}>
              {!isMobile && (
                <Sidebar
                  pages={PAGES}
                  currentPathName={router.pathname}
                  routeHash={this.state.routeHash}
                  isFlowing={!this.state.isSidebarFrozen}
                  distance={this.state.distanceToTop}
                />
              )}
            </Cell>
            <Cell span={Spans.three4th} style={!isMobile && styles.desktopMain}>
              <View
                style={[
                  styles.childrenArea,
                  screen === ScreenSizes.DESKTOP && styles.childrenAreaDesktop,
                ]}
              >
                {sections.map(({ id, children }) => {
                  return (
                    <View key={id} nativeID={id} ref={this.sectionRefs[id]}>
                      {children}
                    </View>
                  )
                })}
              </View>
            </Cell>
          </GridRow>
          <View style={styles.footer} nativeID={FOOTER_ID} ref={this.footer}>
            <Footer />
          </View>
        </View>
      </>
    )
  }
}

const styles = StyleSheet.create({
  conatiner: { isolation: 'isolate' },
  mobileMain: { zIndex: -5, marginTop: 50 },
  desktopMain: { flex: 1, flexBasis: 'calc(75% - 50px)' },
  sidebar: { minWidth: 190, paddingLeft: 0 },
  justNeedSpace: {
    marginTop: HEADER_HEIGHT,
  },
  grayLine: {
    boxShadow: `0px 1px 1px -1px rgba(0,0,0,0.5)`,
  },
  topbar: {
    transitionProperty: 'box-shadow',
    transitionDuration: '400ms',
    boxShadow: `0px 0px 0px 0px rgba(0,0,0,0)`,
    position: 'fixed',
    width: '100%',
    zIndex: 10,
    marginBottom: HEADER_HEIGHT,
  },
  footer: { zIndex: -10, backgroundColor: colors.white },
  childrenArea: {
    minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
  },
  childrenAreaDesktop: {
    // Design calls for *baseline* of text Title to match that of intro on side nav
    transform: [{ translateY: -25 }],
  },
})

export default withRouter(withScreenSize<Props>(Page))

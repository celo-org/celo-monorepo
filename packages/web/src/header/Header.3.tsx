import debounce from 'debounce'
import throttle from 'lodash.throttle'
import dynamic from 'next/dynamic'
import { SingletonRouter as Router, withRouter } from 'next/router'
import * as React from 'react'
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native'
import BlueBanner, { styles as bannerStyle } from 'src/header/BlueBanner'
import cssStyles from 'src/header/Header.3.scss'
import { I18nProps, withNamespaces } from 'src/i18n'
import MediumLogo from 'src/icons/MediumLogo'
import Octocat from 'src/icons/Octocat'
import LogoDarkBg from 'src/logos/LogoDarkBg'
import LogoLightBg from 'src/logos/LogoLightBg'
import Button, { BTN } from 'src/shared/Button.3'
import Footer from 'src/shared/Footer.3'
import Link from 'src/shared/Link'
import menu, { CeloLinks } from 'src/shared/menu-items'
import OvalCoin from 'src/shared/OvalCoin'
import Responsive from 'src/shared/Responsive'
import { DESKTOP_BREAKPOINT, HEADER_HEIGHT } from 'src/shared/Styles'
import { colors } from 'src/styles'
const CookieConsent = dynamic(
  (import('src/header/CookieConsent') as unknown) as Promise<React.ComponentType>
)

const menuItems = [menu.ABOUT_US, menu.JOBS, menu.BUILD, menu.COMMUNITY]
const DARK_PAGES = new Set([
  menu.HOME.link,
  menu.COMMUNITY.link,
  menu.BUILD.link,
  CeloLinks.walletApp,
])

const TRANSLUCENT_PAGES = new Set([menu.ABOUT_US.link])

interface OwnProps {
  router: Router
}

type Props = OwnProps & I18nProps

interface State {
  showDesktopMenu: boolean
  mobileMenuActive: boolean
  menuFaded: boolean
  belowFoldUpScroll: boolean
  isBannerShowing: boolean
  bannerHeight: number
}

function scrollOffset() {
  return window.scrollY || document.documentElement.scrollTop
}

function menuHidePoint() {
  return Dimensions.get('window').height - HEADER_HEIGHT - 1
}

const HAMBURGER_INNER = cssStyles['hamburger-inner']

export class Header extends React.PureComponent<Props, State> {
  lastScrollOffset: number

  handleScroll = throttle(() => {
    const goingUp = this.lastScrollOffset > scrollOffset()
    const belowFold = scrollOffset() > menuHidePoint()

    if (goingUp && belowFold) {
      this.setState({ belowFoldUpScroll: true })
    } else {
      this.setState({ belowFoldUpScroll: false })
    }

    if (goingUp) {
      this.setState({ menuFaded: false })
    } else if (belowFold) {
      this.setState({ menuFaded: true })
    }

    this.lastScrollOffset = scrollOffset()
  }, 100)

  clickHamburger = debounce(() => {
    if (!this.state.mobileMenuActive) {
      this.setState({
        mobileMenuActive: true,
      })
    } else {
      this.closeMenu()
    }
  }, 200)

  constructor(props) {
    super(props)

    this.state = {
      showDesktopMenu: false,
      menuFaded: false,
      mobileMenuActive: false,
      belowFoldUpScroll: false,
      isBannerShowing: false,
      bannerHeight: 0,
    }
  }

  componentDidMount() {
    this.windowResize({ window: Dimensions.get('window') })
    Dimensions.addEventListener('change', this.windowResize)

    this.lastScrollOffset = scrollOffset()
    window.addEventListener('scroll', this.handleScroll)

    this.props.router.events.on('routeChangeComplete', this.closeMenu)
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.windowResize)
    window.removeEventListener('scroll', this.handleScroll)
  }

  windowResize = ({ window: { width } }) => {
    if (width < DESKTOP_BREAKPOINT) {
      if (this.state.showDesktopMenu) {
        this.setState({ showDesktopMenu: false })
      }
    } else {
      if (!this.state.showDesktopMenu) {
        this.setState({ showDesktopMenu: true, mobileMenuActive: false })
      }
    }
  }
  closeMenu = () => {
    this.setState({ mobileMenuActive: false })
  }

  isDarkMode = () => {
    return (
      DARK_PAGES.has(this.props.router.pathname) ||
      (this.props.router.pathname === menu.ABOUT_US.link && !this.state.belowFoldUpScroll)
    )
  }

  isTranslucent = () => {
    return TRANSLUCENT_PAGES.has(this.props.router.pathname)
  }

  getForegroundColor = () => {
    return this.isDarkMode() ? colors.white : colors.dark
  }
  getBackgroundColor = () => {
    if (this.isTranslucent() && !this.state.belowFoldUpScroll) {
      return 'transparent'
    }
    return this.isDarkMode() ? colors.dark : colors.white
  }

  toggleBanner = (isBannerShowing: boolean) => {
    this.setState({ isBannerShowing })
  }

  setBannerHeight = (height: number) => {
    this.setState({ bannerHeight: height })
  }

  render() {
    const { t } = this.props
    const foreground = this.getForegroundColor()
    const background =
      this.state.menuFaded && this.state.showDesktopMenu ? 'transparent' : this.getBackgroundColor()
    const hamburger = this.state.mobileMenuActive ? colors.dark : foreground
    const isHomePage = this.props.router.pathname === menu.HOME.link
    return (
      <View
        // @ts-ignore
        style={[
          styles.container,
          bannerStyle.slideDown,
          { top: isHomePage && this.state.isBannerShowing ? this.state.bannerHeight : 0 },
          this.state.mobileMenuActive && styles.mobileMenuActive,
        ]}
      >
        {/*
        // @ts-ignore */}
        <style global={true} jsx={true}>{`
          .${HAMBURGER_INNER}, .${HAMBURGER_INNER}::before, .${HAMBURGER_INNER}::after {
            background-color: ${hamburger} !important;
          }
        `}</style>
        {isHomePage && (
          <BlueBanner onVisibilityChange={this.toggleBanner} getHeight={this.setBannerHeight} />
        )}

        <View
          // @ts-ignore
          style={[
            styles.background,
            styles.fadeTransition,
            this.state.menuFaded ? styles.menuInvisible : styles.menuVisible,
            {
              backgroundColor: background,
            },
          ]}
        />

        <CookieConsent />
        <Responsive large={[styles.menuContainer, styles.largeMenuContainer]}>
          <View style={styles.menuContainer}>
            <Link href={'/'}>
              <View style={styles.logoLeftContainer}>
                <View style={styles.logoContainer}>
                  <>
                    <View
                      // @ts-ignore
                      style={[
                        styles.fadeTransition,
                        this.state.menuFaded ? styles.menuInvisible : styles.menuVisible,
                      ]}
                    >
                      {this.isDarkMode() ? (
                        <LogoDarkBg
                          height={30}
                          allWhite={this.isTranslucent() && !this.state.belowFoldUpScroll}
                        />
                      ) : (
                        <LogoLightBg height={30} />
                      )}
                    </View>
                  </>
                </View>
              </View>
            </Link>
            {this.state.showDesktopMenu && (
              <View
                style={[
                  styles.links,
                  styles.fadeTransition as ViewStyle,
                  this.state.menuFaded ? styles.menuInvisible : styles.menuVisible,
                ]}
              >
                {menuItems.map((item, index) => (
                  <View key={index} style={styles.linkWrapper}>
                    <Button
                      kind={this.isDarkMode() ? BTN.DARKNAV : BTN.NAV}
                      href={item.link}
                      text={t(item.name)}
                    />
                    {this.props.router.pathname === item.link && (
                      <View style={styles.activeTab}>
                        <OvalCoin color={colors.primary} size={10} />
                      </View>
                    )}
                  </View>
                ))}
                <View style={[styles.linkWrapper]}>
                  <Button
                    kind={this.isDarkMode() ? BTN.DARKNAV : BTN.NAV}
                    href={'https://medium.com/CeloHQ'}
                    text={t('blog')}
                    target={'_blank'}
                    iconRight={<MediumLogo height={20} color={foreground} wrapWithLink={false} />}
                  />
                </View>
                <View style={[styles.linkWrapper]}>
                  <Button
                    kind={this.isDarkMode() ? BTN.DARKNAV : BTN.NAV}
                    href={CeloLinks.gitHub}
                    text={t('github')}
                    target={'_blank'}
                    iconRight={
                      <Octocat size={22} color={this.isDarkMode() ? colors.white : colors.dark} />
                    }
                  />
                </View>
              </View>
            )}
          </View>
        </Responsive>
        <View style={[styles.menuActive, !this.state.mobileMenuActive && styles.hidden]}>
          <View style={styles.mobileOpenContainer}>
            <Footer isVertical={true} currentPage={this.props.router.pathname} />
          </View>
        </View>

        {!this.state.showDesktopMenu && !this.state.menuFaded && (
          <View style={[styles.hamburger]}>
            <div
              className={`${cssStyles.hamburger} ${cssStyles['hamburger--squeeze']} ${
                this.state.mobileMenuActive ? cssStyles['is-active'] : ''
              }`}
              onClick={this.clickHamburger}
            >
              <div className={cssStyles['hamburger-box']}>
                <div className={cssStyles['hamburger-inner']} />
              </div>
            </div>
          </View>
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  fadeTransition: {
    transitionProperty: 'opacity',
    transitionDuration: '300ms',
  },
  menuVisible: {
    opacity: 1,
  },
  menuInvisible: {
    opacity: 0,
    zIndex: -5,
    visibility: 'hidden',
  },
  container: {
    position: 'fixed',
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'row',
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    maxWidth: '100vw',
  },
  mobileOpenContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    height: '100vh',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 1,
    height: HEADER_HEIGHT,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  menuContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    marginLeft: 20,
    marginRight: 0,
  },
  largeMenuContainer: {
    marginHorizontal: 0,
    marginLeft: 0,
    paddingHorizontal: 30,
    position: 'relative',
  },
  logoContainer: {
    paddingLeft: 6,
    paddingTop: 20,
    cursor: 'pointer',
  },
  menuActive: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100vh',
    backgroundColor: colors.white,
    // @ts-ignore
    overflowY: 'scroll',
  },
  mobileMenuActive: { bottom: 0, height: 'auto' },
  activeTab: {
    position: 'absolute',
    height: 8,
    width: 7,
    bottom: -16,
  },
  linkWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginRight: 50,
  },
  hamburger: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  logoLeftContainer: {
    flexDirection: 'row',
  },
  hidden: {
    display: 'none',
  },
  logoLeftVisible: {
    display: 'flex',
  },
})

export default withNamespaces('common')(withRouter<Props>(Header))

import debounce from 'debounce'
import throttle from 'lodash.throttle'
import getConfig from 'next/config'
import { SingletonRouter as Router, withRouter } from 'next/router'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native'
import BlueBanner, { BANNER_HEIGHT } from 'src/header/BlueBanner'
import cssStyles from 'src/header/Header.3.scss'
import Octocat from 'src/icons/Octocat'
import LogoDarkBg from 'src/logos/LogoDarkBg'
import LogoLightBg from 'src/logos/LogoLightBg'
import Button, { BTN } from 'src/shared/Button.3'
import Footer from 'src/shared/Footer.3'
import Link from 'src/shared/Link'
import MediumLogo from 'src/shared/MediumLogo'
import menu, { CeloLinks } from 'src/shared/menu-items'
import OvalCoin from 'src/shared/OvalCoin'
import Responsive from 'src/shared/Responsive'
import { DESKTOP_BREAKPOINT, HEADER_HEIGHT } from 'src/shared/Styles'
import { colors } from 'src/styles'
import CookieConsent from './CookieConsent'

const menuItems = [menu.ABOUT_US, menu.JOBS, menu.BUILD, menu.COMMUNITY]
const DARK_PAGES = new Set([
  menu.HOME.link,
  menu.COMMUNITY.link,
  menu.BUILD.link,
  CeloLinks.faucet,
  CeloLinks.walletApp,
])

function isAlfajores() {
  return getConfig().publicRuntimeConfig.FAUCET
}

interface OwnProps {
  router: Router
}

type Props = OwnProps & WithNamespaces

interface State {
  showDesktopMenu: boolean
  mobileMenuActive: boolean
  mobileMenuFade: Animated.Value
  menuFade: Animated.Value
  menuFaded: boolean
}

function scrollOffset() {
  return window.scrollY || document.documentElement.scrollTop
}

function menuHidePoint() {
  return Dimensions.get('window').height - HEADER_HEIGHT - 1
}

const HAMBURGER_INNER = cssStyles['hamburger-inner']

export class Header extends React.Component<Props, State> {
  lastScrollOffset: number

  handleScroll = throttle(() => {
    // GOing Up

    if (this.lastScrollOffset > scrollOffset()) {
      this.setState({ menuFaded: false }, () => {
        Animated.timing(this.state.menuFade, {
          toValue: 1,
          duration: 100,
          easing: Easing.in(Easing.quad),
        }).start()
      })
    } else if (scrollOffset() > menuHidePoint()) {
      Animated.timing(this.state.menuFade, {
        toValue: 0,
        duration: 100,
        easing: Easing.in(Easing.quad),
      }).start(() => this.setState({ menuFaded: true }))
    }
    this.lastScrollOffset = scrollOffset()
  }, 100)

  clickHamburger = debounce(() => {
    if (!this.state.mobileMenuActive) {
      this.setState(
        {
          mobileMenuActive: true,
        },
        () => {
          Animated.timing(this.state.mobileMenuFade, {
            toValue: 1,
            duration: 150,
            easing: Easing.inOut(Easing.quad),
          }).start()
        }
      )
    } else {
      this.closeMenu()
    }
  }, 200)

  constructor(props) {
    super(props)

    this.state = {
      showDesktopMenu: false,
      mobileMenuFade: new Animated.Value(0),
      menuFade: new Animated.Value(1),
      menuFaded: false,
      mobileMenuActive: false,
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
    Animated.timing(this.state.mobileMenuFade, {
      toValue: 0,
      duration: 200,
      easing: Easing.inOut(Easing.quad),
    }).start(() => this.setState({ mobileMenuActive: false }))
  }

  isDarkMode = () => {
    return DARK_PAGES.has(this.props.router.pathname)
  }

  getForegroundColor = () => {
    return this.isDarkMode() ? colors.white : colors.dark
  }
  getBackgroundColor = () => {
    return this.isDarkMode() ? colors.dark : colors.white
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
        style={[
          styles.container,
          { top: isHomePage ? BANNER_HEIGHT : 0 },
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
        {isHomePage && <BlueBanner />}
        {this.state.menuFaded || (
          <Animated.View
            style={[
              styles.background,
              {
                backgroundColor: background,
                opacity: this.state.menuFade,
              },
            ]}
          />
        )}

        <CookieConsent />
        <Responsive large={[styles.menuContainer, styles.largeMenuContainer]}>
          <View style={styles.menuContainer}>
            <Link href={'/'}>
              <View style={styles.logoLeftContainer}>
                <View style={styles.logoContainer}>
                  {!this.state.menuFaded ? (
                    <>
                      <Animated.View style={[{ opacity: this.state.menuFade }]}>
                        {this.isDarkMode() ? (
                          <LogoDarkBg height={30} />
                        ) : (
                          <LogoLightBg height={30} />
                        )}
                      </Animated.View>
                    </>
                  ) : null}
                </View>
              </View>
            </Link>
            {this.state.showDesktopMenu &&
              !this.state.menuFaded && (
                <Animated.View style={[styles.links, { opacity: this.state.menuFade }]}>
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
                      target={'_new_tab'}
                      iconRight={<MediumLogo height={20} color={foreground} wrapWithLink={false} />}
                    />
                  </View>
                  {isAlfajores() && (
                    <View style={[styles.linkWrapper]}>
                      <Button
                        kind={this.isDarkMode() ? BTN.DARKNAV : BTN.NAV}
                        href={CeloLinks.gitHub}
                        text={t('github')}
                        target={'_new_tab'}
                        iconRight={
                          <Octocat
                            size={18}
                            color={this.isDarkMode() ? colors.white : colors.dark}
                          />
                        }
                      />
                    </View>
                  )}
                </Animated.View>
              )}
          </View>
        </Responsive>
        <Animated.View
          style={[
            styles.menuActive,
            { opacity: this.state.mobileMenuFade },
            !this.state.mobileMenuActive && styles.hidden,
          ]}
        >
          <View style={styles.mobileOpenContainer}>
            <Footer isVertical={true} currentPage={this.props.router.pathname} />
          </View>
        </Animated.View>

        {!this.state.showDesktopMenu &&
          !this.state.menuFaded && (
            <Animated.View style={[styles.hamburger]}>
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
            </Animated.View>
          )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    // @ts-ignore
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
    // @ts-ignore
    display: 'visible',
  },
  medium: {
    display: 'flex',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingLeft: 10,
  },
})

export default withNamespaces('common')(withRouter<Props>(Header))

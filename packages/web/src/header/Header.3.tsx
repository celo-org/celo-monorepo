import debounce from 'debounce'
import throttle from 'lodash.throttle'
import dynamic from 'next/dynamic'
import { SingletonRouter as Router, withRouter } from 'next/router'
import * as React from 'react'
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native'
import { styles as bannerStyle } from 'src/header/BlueBanner'
import Hamburger from 'src/header/Hamburger'
import { I18nProps, withNamespaces } from 'src/i18n'
import MediumLogo from 'src/icons/MediumLogo'
import Octocat from 'src/icons/Octocat'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import LogoDarkBg from 'src/logos/LogoDarkBg'
import LogoLightBg from 'src/logos/LogoLightBg'
import Button, { BTN } from 'src/shared/Button.3'
import Hoverable from 'src/shared/Hoverable'
import Link from 'src/shared/Link'
import menu, { CeloLinks, MAIN_MENU } from 'src/shared/menu-items'
import MobileMenu from 'src/shared/MobileMenu'
import OvalCoin from 'src/shared/OvalCoin'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors } from 'src/styles'
const BlueBanner = dynamic(import('src/header/BlueBanner'), { loading: () => null, ssr: false })
const CookieConsent = dynamic(
  (import('src/header/CookieConsent') as unknown) as Promise<React.ComponentType>
)

const menuItems = MAIN_MENU
const DARK_PAGES = new Set([
  menu.HOME.link,
  menu.BUILD.link,
  menu.ALLIANCE_COLLECTIVE.link,
  menu.DEVELOPERS.link,
  menu.VALIDATORS_LIST.link,
  menu.VALIDATORS_LIST__BAKLAVA.link,
  menu.VALIDATORS_LIST_BAKLAVASTAGING.link,
  CeloLinks.walletApp,
])

const TRANSLUCENT_PAGES = new Set([menu.ABOUT_US.link, menu.ALLIANCE_COLLECTIVE.link])

interface OwnProps {
  router: Router
}

type Props = OwnProps & I18nProps & ScreenProps

interface State {
  mobileMenuActive: boolean
  menuFaded: boolean
  belowFoldUpScroll: boolean
  isBannerShowing: boolean
  isHovering: boolean
  bannerHeight: number
}

function scrollOffset() {
  return window.scrollY || document.documentElement.scrollTop
}

function menuHidePoint() {
  return Dimensions.get('window').height - HEADER_HEIGHT - 1
}

export class Header extends React.PureComponent<Props, State> {
  lastScrollOffset: number

  state = {
    showDesktopMenu: false,
    menuFaded: false,
    mobileMenuActive: false,
    belowFoldUpScroll: false,
    isBannerShowing: false,
    isHovering: false,
    bannerHeight: 0,
  }

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

  componentDidMount() {
    this.lastScrollOffset = scrollOffset()
    window.addEventListener('scroll', this.handleScroll)

    this.props.router.events.on('routeChangeComplete', this.closeMenu)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
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
      return this.state.isHovering ? colors.darkTransparent : 'transparent'
    }
    return this.isDarkMode() ? colors.dark : colors.white
  }

  toggleBanner = (isBannerShowing: boolean) => {
    this.setState({ isBannerShowing })
  }

  setBannerHeight = (height: number) => {
    this.setState({ bannerHeight: height })
  }

  allWhiteLogo = () => {
    return this.props.router.pathname === menu.ABOUT_US.link && !this.state.belowFoldUpScroll
  }

  setHovering = () => {
    if (this.props.screen === ScreenSizes.DESKTOP) {
      this.setState({ isHovering: true })
    }
  }
  unsetHovering = () => {
    this.setState({ isHovering: false })
  }

  willShowHamburger = () => {
    if (this.props.screen === ScreenSizes.DESKTOP) {
      return false
    }

    if (this.state.menuFaded && !this.state.mobileMenuActive) {
      return false
    }

    return true
  }

  render() {
    const { t, screen } = this.props
    const isDesktop = screen === ScreenSizes.DESKTOP
    const foreground = this.getForegroundColor()
    const background = this.state.menuFaded && isDesktop ? 'transparent' : this.getBackgroundColor()
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
        <Hoverable onHoverIn={this.setHovering} onHoverOut={this.unsetHovering}>
          <View style={[styles.menuContainer, isDesktop && styles.largeMenuContainer]}>
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
                        <LogoDarkBg height={30} allWhite={this.allWhiteLogo()} />
                      ) : (
                        <LogoLightBg height={30} />
                      )}
                    </View>
                  </>
                </View>
              </View>
            </Link>
            {isDesktop && (
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
                <View style={styles.linkWrapper}>
                  <Button
                    kind={this.isDarkMode() ? BTN.DARKNAV : BTN.NAV}
                    href={'https://medium.com/CeloHQ'}
                    text={t('blog')}
                    target={'_blank'}
                    iconRight={<MediumLogo height={20} color={foreground} wrapWithLink={false} />}
                  />
                </View>
                <View style={[styles.linkWrapper, styles.lastLink]}>
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
        </Hoverable>

        {this.state.mobileMenuActive && (
          <View style={styles.menuActive}>
            <View style={styles.mobileOpenContainer}>
              <MobileMenu currentPage={this.props.router.pathname} />
            </View>
          </View>
        )}

        {this.willShowHamburger() && (
          <View
            style={[
              styles.hamburger,
              isHomePage &&
                !this.state.mobileMenuActive && {
                  transform: [{ translateY: this.state.bannerHeight }],
                },
            ]}
          >
            <Hamburger
              isOpen={this.state.mobileMenuActive}
              onPress={this.clickHamburger}
              color={this.getForegroundColor()}
            />
          </View>
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  fadeTransition: {
    transitionProperty: 'opacity color',
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
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100vh',
    backgroundColor: colors.white,
    overflowY: 'scroll',
  },
  mobileMenuActive: {
    bottom: 0,
    top: 0,
    height: 'auto',
    position: 'absolute',
    overflowY: 'hidden',
  },
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
    marginHorizontal: 20,
  },
  lastLink: {
    marginRight: 10,
  },
  hamburger: {
    position: 'fixed',
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

export default withNamespaces('common')(withScreenSize(withRouter<Props>(Header)))

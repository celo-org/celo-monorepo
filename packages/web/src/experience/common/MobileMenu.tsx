import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ROUTE_TO_TITLE } from 'src/experience/brandkit/common/Page'
import scrollToHash from 'src/experience/common/scrollToHash'
import Sidebar, { Page } from 'src/experience/common/Sidebar'
import Triangle, { Direction } from 'src/shared/Triangle'
import { colors, fonts, standardStyles } from 'src/styles'
interface Props {
  pages: Page[]
  pathname: string
  routeHash: string
}

interface State {
  isOpen: boolean
}

export default class MobileMenu extends React.PureComponent<Props, State> {
  state = { isOpen: false }

  componentDidMount = () => {
    window.addEventListener('hashchange', this.closeMenu, false)
  }

  closeMenu = () => {
    this.setState({ isOpen: false })
  }

  componentWillUnmount = () => {
    window.removeEventListener('hashchange', this.closeMenu)
  }

  toggleMenu = () => {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }))
  }

  goToSubSection = () => {
    scrollToHash(50)
    this.closeMenu()
  }

  render() {
    const { pages, pathname } = this.props
    return (
      <View style={styles.container}>
        <TouchableOpacity testID="toggle" onPress={this.toggleMenu}>
          <View style={[standardStyles.row, styles.bar]}>
            <Text style={fonts.h6}>{pageTitleFromRoute(pathname)}</Text>
            <Triangle direction={this.state.isOpen ? Direction.up : Direction.down} />
          </View>
        </TouchableOpacity>
        <View style={[styles.menu, this.state.isOpen && styles.open]}>
          <View style={styles.sideBar}>
            <Sidebar
              pages={pages}
              currentPathName={pathname}
              routeHash={this.props.routeHash}
              onChangeRoute={this.goToSubSection}
            />
          </View>
        </View>
      </View>
    )
  }
}

function pageTitleFromRoute(route: string) {
  return ROUTE_TO_TITLE[route]
}

const styles = StyleSheet.create({
  sideBar: {
    zIndex: 10,
    position: 'absolute',
    backgroundColor: `${colors.light}`,
    height: 'calc(100vh - 130px)',
    overflow: 'scroll',
    width: '100%',
    padding: 15,
  },
  container: {
    position: 'fixed',
    width: '100%',
    top: 70,
    backgroundColor: colors.white,
  },
  bar: {
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: colors.gray,
    borderBottomWidth: 1,
  },
  menu: {
    height: '100%',
    transform: [{ scaleY: 0 }],
    transitionDuration: '250ms',
    transitionProperty: 'transform',
    transformOrigin: 'top',
  },
  open: {
    transform: [{ scaleY: 1 }],
  },
})

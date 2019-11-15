import * as React from 'react'
import { Text, View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native'
import Sidebar, { Page } from 'src/brandkit/Sidebar'
import { standardStyles, colors } from 'src/styles'
import Triangle, { Direction } from 'src/shared/Triangle'

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

  render() {
    const { pages, pathname } = this.props
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.toggleMenu}>
          <View style={[standardStyles.row, styles.bar]}>
            <Text>{pageTitleFromRoute(pathname)}</Text>
            <Triangle direction={Direction.up} />
          </View>
        </TouchableOpacity>
        <View style={[styles.menu, this.state.isOpen && styles.open]}>
          <View
            style={{
              zIndex: 10,
              position: 'absolute',
              backgroundColor: `${colors.light}`,
              height: 'calc(100vh - 130px)',
              width: '100%',
            }}
          >
            <View style={{ padding: 15 }}>
              <Sidebar pages={pages} currentPathName={pathname} routeHash={this.props.routeHash} />
            </View>
          </View>
        </View>
      </View>
    )
  }
}

// TODO something better props a hash map
function pageTitleFromRoute(route: string) {
  return route.toUpperCase()
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    width: '100%',
    top: 70,
    // height: '100vh',
    backgroundColor: colors.white,
    // transform: [{ translateZ: 0, height: '100%' }],
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
    transitionDuration: '200ms',
    transitionProperty: 'transform',
    transformOrigin: 'top',
  },
  open: {
    transform: [{ scaleY: 1 }],
  },
})

import throttle from 'lodash.throttle'
import * as React from 'react'
import { Dimensions } from 'react-native'
import { DESKTOP_BREAKPOINT, TABLET_BREAKPOINT } from 'src/shared/Styles'

export enum ScreenSizes {
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  DESKTOP = 'DESKTOP',
}

interface State {
  screen: ScreenSizes
}

const defaultContext = { screen: null }

export const ScreenSizeContext = React.createContext(defaultContext)

export class ScreenSizeProvider extends React.PureComponent<{}, State> {
  state = defaultContext

  windowResize = throttle(({ window: { width } }) => {
    const newScreen = widthToScreenType(width)
    if (newScreen !== this.state.screen) {
      this.setState({ screen: newScreen })
    }
  }, 50)

  componentDidMount() {
    this.windowResize({ window: Dimensions.get('window') })
    Dimensions.addEventListener('change', this.windowResize)
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.windowResize)
    this.windowResize.cancel()
  }

  render() {
    return (
      <ScreenSizeContext.Provider value={this.state}>
        {/* if js is off just render the children bc state.screen will always be null in that case */}
        <noscript>{this.props.children}</noscript>
        {this.state.screen && this.props.children}
      </ScreenSizeContext.Provider>
    )
  }
}

function widthToScreenType(width: number) {
  if (width >= DESKTOP_BREAKPOINT) {
    return ScreenSizes.DESKTOP
  } else if (width >= TABLET_BREAKPOINT) {
    return ScreenSizes.TABLET
  } else {
    return ScreenSizes.MOBILE
  }
}

export interface ScreenProps {
  screen: ScreenSizes
}

export function withScreenSize<T>(Component: React.ComponentType<T>) {
  return function ScreenSizeContainer(props: any) {
    return (
      <ScreenSizeContext.Consumer>
        {({ screen }) => {
          return <Component screen={screen} {...props} />
        }}
      </ScreenSizeContext.Consumer>
    )
  }
}

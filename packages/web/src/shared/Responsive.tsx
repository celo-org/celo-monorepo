import * as React from 'react'
import { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native'
import { ScreenSizeContext, ScreenSizes } from 'src/layout/ScreenSize'

type SharedStyle = StyleProp<ImageStyle | TextStyle | ViewStyle>

interface Props {
  medium?: SharedStyle | SharedStyle[]
  large?: SharedStyle | SharedStyle[]
}

export default class Responsive extends React.Component<Props> {
  getStyle = (screen: ScreenSizes) => {
    if (screen === ScreenSizes.DESKTOP) {
      if (this.props.large) {
        return { style: this.props.large }
      } else if (this.props.medium) {
        return { style: this.props.medium }
      }
    } else if (screen === ScreenSizes.TABLET) {
      if (this.props.medium) {
        return { style: this.props.medium }
      } else {
        return undefined
      }
    }
    return undefined
  }

  render() {
    return (
      <ScreenSizeContext.Consumer>
        {({ screen }) => {
          const style = this.getStyle(screen)

          return React.Children.map(this.props.children, (child) => {
            if (child) {
              return React.cloneElement(
                // @ts-ignore
                child,
                style
              )
            }
          })
        }}
      </ScreenSizeContext.Consumer>
    )
  }
}

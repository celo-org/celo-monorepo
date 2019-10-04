import * as React from 'react'
import Touchable from 'react-native-platform-touchable'

export interface Props {
  borderless?: boolean
  onPress?: () => void
  children: React.ReactNode // must only have one direct child. see https://github.com/react-native-community/react-native-platform-touchable#touchable
  disabled?: boolean
  style?: any
  testID?: string
  hitSlop?: {
    top?: number
    left?: number
    bottom?: number
    right?: number
  }
}

export default class TouchableDefault extends React.PureComponent<Props> {
  delayedOnPress = () => {
    // Add a small delay so animations are seen
    setTimeout(this.props.onPress, 50)
  }
  effect = () => {
    return this.props.borderless
      ? Touchable.SelectableBackgroundBorderless()
      : Touchable.SelectableBackground()
  }
  render() {
    const { onPress, children, ...passThroughProps } = this.props
    return (
      <Touchable {...passThroughProps} onPress={this.delayedOnPress} background={this.effect()}>
        {children}
      </Touchable>
    )
  }
}

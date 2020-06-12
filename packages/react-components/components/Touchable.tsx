import * as React from 'react'
import { TouchableWithoutFeedbackProps } from 'react-native'
import Touchable from 'react-native-platform-touchable'

export interface Props extends TouchableWithoutFeedbackProps {
  borderless?: boolean
  children: React.ReactNode // must only have one direct child. see https://github.com/react-native-community/react-native-platform-touchable#touchable
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

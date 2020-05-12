/**
 * Adapted from
 * https://github.com/Andr3wHur5t/react-native-keyboard-spacer
 */

import * as React from 'react'
import {
  EmitterSubscription,
  Keyboard,
  KeyboardEvent,
  LayoutAnimation,
  LayoutAnimationConfig,
  LayoutRectangle,
  Platform,
  ScreenRect,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'

const styles = StyleSheet.create({
  container: {
    left: 0,
    right: 0,
    bottom: 0,
  },
})

// From: https://medium.com/man-moon/writing-modern-react-native-ui-e317ff956f02
const defaultAnimation: LayoutAnimationConfig = {
  duration: 500,
  create: {
    duration: 300,
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 200,
  },
}

interface Props {
  topSpacing: number
  onToggle: (visible: boolean, keyboardSpace?: number) => void
  style?: ViewStyle
}

export default class KeyboardSpacer extends React.Component<Props> {
  static defaultProps = {
    topSpacing: 0,
    // tslint:disable-next-line: no-empty
    onToggle: (visible: boolean, keyboardSpace: number) => {},
  }

  _listeners: EmitterSubscription[] = []
  _viewRef = React.createRef<View>()
  _currentMeasureToken: object | null = null

  state = {
    keyboardSpace: 0,
  }

  componentDidMount() {
    const updateListener = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow'
    const resetListener = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide'
    this._listeners = [
      Keyboard.addListener(updateListener, this.updateKeyboardSpace),
      Keyboard.addListener(resetListener, this.resetKeyboardSpace),
    ]
  }

  componentWillUnmount() {
    this._listeners.forEach((listener) => listener.remove())
  }

  relativeKeyboardHeight(viewFrame: LayoutRectangle, keyboardFrame: ScreenRect): number {
    if (!viewFrame || !keyboardFrame) {
      return 0
    }

    const keyboardY = keyboardFrame.screenY - this.props.topSpacing

    // Calculate the displacement needed for the view such that it
    // no longer overlaps with the keyboard
    return Math.max(viewFrame.y + viewFrame.height - keyboardY, 0)
  }

  updateKeyboardSpace = (event: KeyboardEvent) => {
    if (!event.endCoordinates) {
      this.props.onToggle(true)
      return
    }

    if (!this._viewRef.current) {
      this.props.onToggle(true)
      return
    }

    // Create a new token to cancel the async measureInWindow
    // This is needed as both keyboardWillShow and keyboardWillHide are triggered sequentially
    // when toggling the keyboard visibility on iOS (command + K on simulator)
    const measureToken = (this._currentMeasureToken = {})

    this._viewRef.current.measureInWindow((x, y, width, height) => {
      if (this._currentMeasureToken !== measureToken) {
        // Skip action as token is different (i.e. cancelled)
        return
      }
      let animationConfig = defaultAnimation
      if (event.duration) {
        animationConfig = LayoutAnimation.create(
          event.duration,
          LayoutAnimation.Types[event.easing],
          LayoutAnimation.Properties.opacity
        )
      }
      LayoutAnimation.configureNext(animationConfig)

      const viewFrame = { x, y, width, height }
      const keyboardFrame = event.endCoordinates
      const keyboardSpace = this.relativeKeyboardHeight(viewFrame, keyboardFrame)

      this.setState({ keyboardSpace })
      this.props.onToggle(true, keyboardSpace)
    })
  }

  resetKeyboardSpace = (event: KeyboardEvent) => {
    // This cancels measureInWindow
    this._currentMeasureToken = null

    let animationConfig = defaultAnimation
    if (event && event.duration) {
      animationConfig = LayoutAnimation.create(
        event.duration,
        LayoutAnimation.Types[event.easing],
        LayoutAnimation.Properties.opacity
      )
    }
    LayoutAnimation.configureNext(animationConfig)

    this.setState({ keyboardSpace: 0 })
    this.props.onToggle(false, 0)
  }

  render() {
    if (Platform.OS === 'android') {
      // On Android with windowSoftInputMode set to adjustResize we don't need the spacer
      return null
    }

    return (
      <View
        ref={this._viewRef}
        style={[styles.container, { height: this.state.keyboardSpace }, this.props.style]}
      />
    )
  }
}

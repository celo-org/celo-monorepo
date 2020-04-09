import * as React from 'react'
import { Animated, StyleSheet, View, ViewStyle } from 'react-native'

interface Props {
  color: string
  circleStartSize: number
  style?: ViewStyle
  animated?: boolean
}

interface State {
  circleScale: Animated.Value
  fadeOpacity: Animated.Value
}

export default class PulsingDot extends React.PureComponent<Props, State> {
  circleStartScale: number = 1
  circleEndScale: number = 3
  circleStartSize: number = this.props.circleStartSize
  circleEndSize: number = this.circleStartSize * this.circleEndScale
  circleAnimationLength: number = 1000
  circleAnimationDelay: number = 700

  state = {
    circleScale: new Animated.Value(this.circleStartScale),
    fadeOpacity: new Animated.Value(1),
  }

  componentDidMount() {
    if (!this.props.animated) {
      return
    }
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(this.state.fadeOpacity, {
            toValue: 0,
            duration: this.circleAnimationLength,
            delay: this.circleAnimationDelay,
            isInteraction: false,
            useNativeDriver: true,
          }),
          Animated.timing(this.state.fadeOpacity, {
            toValue: 1,
            duration: 0,
            isInteraction: false,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(this.state.circleScale, {
            toValue: this.circleEndScale,
            duration: this.circleAnimationLength,
            delay: 500,
            isInteraction: false,
            useNativeDriver: true,
          }),
          Animated.timing(this.state.circleScale, {
            toValue: this.circleStartScale,
            duration: 0,
            isInteraction: false,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start()
  }

  render() {
    const { circleScale, fadeOpacity } = this.state
    // let circleScaleNum: number
    this.state.circleScale.addListener(
      ({ value }) => ((this.state.circleScale as any)._value = value)
    )
    return (
      <View
        style={[
          style.circleContainer,
          { width: this.circleEndSize, height: this.circleEndSize },
          this.props.style,
        ]}
      >
        <Animated.View
          style={[
            {
              backgroundColor: this.props.color,
              width: this.circleStartSize,
              height: this.circleStartSize,
              borderRadius: this.circleStartSize / 2,
              opacity: fadeOpacity,
              transform: [
                { scale: circleScale },
                { perspective: 1000 }, // without this line this Animation will not render on Android
              ],
            },
          ]}
        />
        <View
          style={{
            backgroundColor: this.props.color,
            width: this.circleStartSize,
            height: this.circleStartSize,
            borderRadius: this.circleStartSize / 2,
            position: 'absolute',
          }}
        />
      </View>
    )
  }
}

const style = StyleSheet.create({
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

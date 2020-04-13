import * as React from 'react'
import { Animated, StyleSheet, View, ViewStyle } from 'react-native'

const CIRCLE_START = 1
const CIRCLE_END = 3
const DELAY = 200
const DURATION = 1500

interface Props {
  color: string
  circleStartSize: number
  style?: ViewStyle
  animated?: boolean
}

interface State {
  pulse: Animated.Value
}

export default class PulsingDot extends React.PureComponent<Props, State> {
  state = {
    pulse: new Animated.Value(0),
  }

  componentDidMount() {
    if (!this.props.animated) {
      return
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.state.pulse, {
          toValue: 1,
          duration: DURATION,
          delay: DELAY,
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.timing(this.state.pulse, {
          toValue: 0,
          delay: 0,
          duration: 0,
          isInteraction: false,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  render() {
    const { pulse } = this.state

    const circleStartSize = this.props.circleStartSize * CIRCLE_START
    const circleEndSize = this.props.circleStartSize * CIRCLE_END

    return (
      <View
        style={[
          style.circleContainer,
          { width: circleEndSize, height: circleEndSize },
          this.props.style,
        ]}
      >
        <Animated.View
          style={[
            {
              backgroundColor: this.props.color,
              width: circleStartSize,
              height: circleStartSize,
              borderRadius: circleStartSize / 2,
              opacity: pulse.interpolate({
                inputRange: [0, 0.5, 0.75, 1],
                outputRange: [1, 1, 0.9, 0],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, CIRCLE_END],
                  }),
                },
                { perspective: 1000 }, // without this line this Animation will not render on Android
              ],
            },
          ]}
        />
        <View
          style={{
            backgroundColor: this.props.color,
            width: circleStartSize,
            height: circleStartSize,
            borderRadius: circleStartSize / 2,
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

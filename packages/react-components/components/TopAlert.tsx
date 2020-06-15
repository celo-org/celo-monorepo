import * as React from 'react'
import { Animated, StyleSheet } from 'react-native'

interface Props {
  height: number
  backgroundColor: string
  visible: boolean
  style?: any
}

const ANIMATION_DURATION = 350

export default class TopAlert extends React.Component<Props> {
  height: Animated.Value
  opacity: Animated.Value
  constructor(props: Props) {
    super(props)
    this.height = new Animated.Value(props.visible ? props.height : 0)
    this.opacity = new Animated.Value(props.visible ? 1.0 : 0)
    this.state = {
      showChildren: props.visible,
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.visible && this.props.visible) {
      Animated.parallel([
        Animated.timing(this.height, {
          duration: ANIMATION_DURATION,
          toValue: prevProps.height,
          useNativeDriver: true,
        }),
        Animated.timing(this.opacity, {
          duration: ANIMATION_DURATION / 2,
          toValue: 1.0,
          delay: ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
      ]).start()
    } else if (prevProps.visible && !this.props.visible) {
      Animated.parallel([
        Animated.timing(this.height, {
          duration: ANIMATION_DURATION,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(this.opacity, {
          duration: ANIMATION_DURATION / 2,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  render() {
    const { children, backgroundColor, style } = this.props
    return (
      <Animated.View style={{ backgroundColor, height: this.height }}>
        <Animated.View style={[styles.opacity, { opacity: this.opacity }, style]}>
          {children}
        </Animated.View>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  opacity: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
})

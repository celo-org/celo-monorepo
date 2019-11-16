import variables from '@celo/react-components/styles/variables'
import LottieView from 'lottie-react-native'
import React from 'react'

interface Props {
  width?: number
  onAnimationFinish?: () => void
}

export default class DancingRings extends React.PureComponent<Props> {
  static defaultProps = {
    width: 40,
  }

  animation: LottieView | null | undefined

  componentDidMount() {
    // Note(Rossy): This should not be required but the animation does not autoplay on iOS
    // Possibly related: https://github.com/react-native-community/lottie-react-native/issues/581
    setTimeout(() => {
      if (this.animation) {
        this.animation.play()
      }
    }, 10)
  }

  render() {
    return (
      <LottieView
        ref={(animation) => {
          this.animation = animation
        }}
        source={require('./dancingRings.json')}
        autoPlay={false}
        loop={false}
        style={style}
        onAnimationFinish={this.props.onAnimationFinish}
      />
    )
  }
}

const style = { width: variables.width, height: variables.height * 1.25, zIndex: 0 }

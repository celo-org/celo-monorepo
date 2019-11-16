import LottieView from 'lottie-react-native'
import React from 'react'

interface Props {
  width?: number
}

export default class LoadingSpinner extends React.PureComponent<Props> {
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
        source={require('./loadingSpinnerGreen.json')}
        autoPlay={true}
        loop={true}
        style={{ width: this.props.width }}
      />
    )
  }
}

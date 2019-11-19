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

import LottieView from 'lottie-react-native'
import React from 'react'

interface Props {
  width?: number
}

export default class LoadingSpinner extends React.PureComponent<Props> {
  static defaultProps = {
    width: 40,
  }

  render() {
    return (
      <LottieView
        source={require('./loadingSpinnerGreen.json')}
        autoPlay={true}
        loop={true}
        style={{ width: this.props.width }}
      />
    )
  }
}

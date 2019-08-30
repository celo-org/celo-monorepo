import lottie, { AnimationItem } from 'lottie-web'
import * as React from 'react'
import { View } from 'react-native'
interface Props {
  path: string
  size: number
}

export default class LottieBase extends React.Component<Props> {
  elementRef = React.createRef<HTMLElement>()

  animation: AnimationItem

  componentDidMount = () => {
    this.animation = lottie.loadAnimation({
      container: this.elementRef.current,
      renderer: 'canvas',
      loop: true,
      autoplay: true,
      path: `/static/lottieFiles/${this.props.path}`,
    })
  }

  componentWillUnmount = () => {
    this.animation.destroy()
  }

  render() {
    return (
      <View style={[{ width: this.props.size, height: this.props.size }]}>
        <span ref={this.elementRef} style={{ width: '100%', height: '100%' }} />
      </View>
    )
  }
}

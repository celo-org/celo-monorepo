import lottie, { AnimationItem } from 'lottie-web'
import * as React from 'react'
interface Props {
  path?: string
  data?: object
  loop: boolean
}

export default class LottieBase extends React.Component<Props> {
  elementRef = React.createRef<HTMLSpanElement>()

  animation: AnimationItem

  componentDidMount = () => {
    this.animation = lottie.loadAnimation({
      container: this.elementRef.current,
      renderer: 'svg',
      loop: this.props.loop,
      autoplay: true,
      animationData: this.props.data,
      path: this.props.path ? `/lottieFiles/${this.props.path}` : undefined,
    })
  }

  componentWillUnmount = () => {
    this.animation.destroy()
  }

  render() {
    return <span ref={this.elementRef} style={expand} />
  }
}

const expand = { width: '100%', height: '100%' }

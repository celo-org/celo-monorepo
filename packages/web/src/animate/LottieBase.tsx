import lottie, { AnimationItem } from 'lottie-web'
import * as React from 'react'
interface Props {
  path: string
}

export default class LottieBase extends React.Component<Props> {
  elementRef = React.createRef<HTMLSpanElement>()

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
    return <span ref={this.elementRef} style={expand} />
  }
}

const expand = { width: '100%', height: '100%' }

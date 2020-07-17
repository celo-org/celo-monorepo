import lottie, { AnimationItem } from 'lottie-web'
import * as React from 'react'
interface Props {
  path?: string
  data?: object
  loop: boolean
  autoPlay: boolean
  onReady?: () => void
  onLooped?: (data: any) => void
}

export default class LottieBase extends React.Component<Props> {
  elementRef = React.createRef<HTMLSpanElement>()

  animation: AnimationItem

  componentDidMount = () => {
    this.animation = lottie.loadAnimation({
      container: this.elementRef.current,
      renderer: 'svg',
      loop: this.props.loop,
      autoplay: this.props.autoPlay,
      animationData: this.props.data,
      path: this.props.path ? `/lottieFiles/${this.props.path}` : undefined,
      rendererSettings: {
        progressiveLoad: true,
      },
    })
    if (this.props.onReady && this.animation.addEventListener) {
      this.animation.addEventListener('DOMLoaded', this.props.onReady)
    }
    if (this.props.onLooped && this.animation.addEventListener) {
      this.animation.addEventListener('loopComplete', this.onLoop)
    }
  }
  onLoop = (data) => {
    this.props.onLooped(data)
  }

  componentWillUnmount = () => {
    this.animation.destroy()
  }

  render() {
    return <span ref={this.elementRef} style={expand} />
  }
}

const expand = { width: '100%', height: '100%' }

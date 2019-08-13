import * as React from 'react'
import { StyleSheet } from 'react-native'
import { createElement } from 'react-native-web'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Responsive from 'src/shared/Responsive'
import { HEADER_HEIGHT } from 'src/shared/Styles'
const Video = React.forwardRef((props, ref) => createElement('video', { ...props, ref }))
const Source = (props) => createElement('source', props)

interface Props {
  onLoaded: () => void
  onFinished: () => void
}

class HomeAnimation extends React.Component<Props & ScreenProps> {
  video: any
  started = false

  videoLoaded = () => {
    if (this.video) {
      if (!this.started) {
        this.props.onLoaded()
        this.video.play()
      }
      this.started = true
    }
  }

  videoRef = (ref) => {
    this.video = ref
    if (this.video) {
      this.video.oncanplaythrough = () => this.videoLoaded()
      this.video.load()
      this.video.onended = () => this.restartVideo()
    }
  }

  restartVideo = () => {
    this.props.onFinished()
    setTimeout(() => {
      if (this.video) {
        this.video.currentTime = 0
        this.started = false
        this.videoLoaded()
      }
    }, 200)
  }

  source = () => {
    if (this.props.screen === ScreenSizes.MOBILE) {
      return '//storage.googleapis.com/celo-website/celo-animation-mobile.mp4'
    }

    return '//storage.googleapis.com/celo-website/celo-animation.mp4'
  }

  render() {
    return (
      <Responsive large={styles.video}>
        {/*
        // @ts-ignore */}
        <Video
          ref={this.videoRef}
          style={styles.videoMedium}
          preload={'auto'}
          muted={true}
          playsInline={true}
        >
          <Source src={this.source()} type="video/mp4" />
        </Video>
      </Responsive>
    )
  }
}

export default withScreenSize(HomeAnimation)

const styles = StyleSheet.create({
  video: {
    height: '80vh',
    width: '100vw',
    objectFit: 'contain',
  },
  videoMedium: {
    width: '100vw',
    objectFit: 'contain',
    marginBottom: 400,
    marginTop: HEADER_HEIGHT,
  },
})

import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { createElement } from 'react-native-web'
import HomeOracle from 'src/home/HomeOracle'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Responsive from 'src/shared/Responsive'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { standardStyles } from 'src/styles'

const Video = React.forwardRef((props, ref) => createElement('video', { ...props, ref }))
const Source = (props) => createElement('source', props)
export interface Props {
  mode: Mode
  onLoaded: () => void
  onFinished: () => void
}
export enum Mode {
  'wait',
  'video',
  'graphic',
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
    if (this.props.mode === Mode.graphic) {
      return (
        <Responsive large={[styles.still, standardStyles.centered]}>
          <View style={[styles.stillMobile]}>
            <HomeOracle />
          </View>
        </Responsive>
      )
    }

    return (
      <Responsive large={styles.video}>
        {/*
        // @ts-ignore */}
        <Video
          ref={this.videoRef}
          style={styles.videoSmall}
          preload={'auto'}
          muted={true}
          playsInline={true}
        >
          <Source src={this.source()} type="video/mp4" />
        </Video>
        {/* <canvas> */}
      </Responsive>
    )
  }
}

export default withScreenSize(HomeAnimation)

export const styles = StyleSheet.create({
  still: {
    height: 'calc(100% - 250px)',
  },
  stillMobile: {
    height: '100%',
    marginTop: HEADER_HEIGHT,
    paddingTop: 50,
    justifyContent: 'flex-start',
  },
  video: {
    height: '75vh',
    width: '100vw',
    objectFit: 'contain',
  },
  videoSmall: {
    width: '100vw',
    objectFit: 'contain',
    marginTop: 50,
  },
})

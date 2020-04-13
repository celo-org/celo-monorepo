import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { createElement } from 'react-native-web'
import HomeOracle from 'src/home/HomeOracle'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Responsive from 'src/shared/Responsive'
import { standardStyles } from 'src/styles'

const Video = React.forwardRef((props, ref) => createElement('video', { ...props, ref }))
const Source = (props) => createElement('source', props)
export interface Props {
  mode: Mode
  onLoaded: () => void
  onFinished: () => void
  onError: () => void
}
export enum Mode {
  'wait',
  'transition',
  'video',
  'graphic',
}

class HomeAnimation extends React.Component<Props & ScreenProps> {
  video: any
  started = false

  startVideo = async () => {
    if (this.video) {
      if (!this.started) {
        try {
          this.started = true
          await this.video.play()

          this.props.onLoaded()
        } catch {
          this.props.onError()
        }
      }
    }
  }

  videoRef = (ref) => {
    this.video = ref
    if (this.video) {
      this.video.oncanplaythrough = () => this.startVideo()
      this.video.load()
      this.video.onended = () => this.restartVideo()
    }
  }

  restartVideo = () => {
    this.props.onFinished()

    setTimeout(async () => {
      if (this.video) {
        this.video.currentTime = 0
        this.started = false
        await this.startVideo()
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
    const { mode } = this.props
    if (mode === Mode.graphic || mode === Mode.wait || mode === Mode.transition) {
      return (
        <Responsive
          large={[
            styles.still,
            standardStyles.centered,
            mode === Mode.transition && styles.fadeOut,
          ]}
        >
          <View style={[styles.stillMobile, mode === Mode.transition && styles.fadeOut]}>
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
          autoPlay={true}
          playsInline={true}
        >
          <Source src={this.source()} type="video/mp4" />
        </Video>
      </Responsive>
    )
  }
}

export default withScreenSize(HomeAnimation)

export const styles = StyleSheet.create({
  fadeOut: {
    animationFillMode: 'both',
    animationDelay: '2700ms',
    animationDuration: '300ms',
    animationKeyframes: [
      {
        from: {
          opacity: 1,
        },
        to: {
          opacity: 0.1,
        },
      },
    ],
  },
  still: {
    height: '70vh',
    justifyContent: 'center',
  },
  stillMobile: {
    height: '100%',
    paddingTop: 50,
    justifyContent: 'center',
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

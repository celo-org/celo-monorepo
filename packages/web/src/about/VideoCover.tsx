import * as React from 'react'
import { createElement, Image, NetInfo, StyleSheet, View, ViewStyle } from 'react-native'
import { BeautifulMoneyPreview } from 'src/about/images/index'
import { H1, H3 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Hoverable from 'src/shared/Hoverable'
import { PlayCircle2 } from 'src/shared/PlayCircle'
import VideoModal from 'src/shared/VideoModal'
import { standardStyles, textStyles } from 'src/styles'

import { getEffectiveConnection, SLOW_CONNECTIONS } from 'src/utils/utils'
interface State {
  isHovering: boolean
  supportsVideo: boolean
}

interface VideoProps {
  style?: ViewStyle | ViewStyle[]
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  poster?: string
  children: React.ReactNode
}

function Video(props: VideoProps) {
  return createElement('video', props)
}

class VideoCover extends React.PureComponent<I18nProps & ScreenProps, State> {
  state: State = {
    isHovering: false,
    supportsVideo: false,
  }

  onHoverStart = () => {
    this.setState({ isHovering: true })
  }
  onHoverEnd = () => {
    this.setState({ isHovering: false })
  }

  componentDidMount = () => {
    const connectionType = getEffectiveConnection(window.navigator)
    if (!SLOW_CONNECTIONS.has(connectionType)) {
      this.setState({ supportsVideo: true })
    }
  }

  render() {
    const { t, screen } = this.props
    return (
      <View style={[styles.cover]}>
        <View style={styles.background}>
          <Video
            style={[styles.video, this.state.isHovering && styles.videoHover]}
            muted={true}
            autoPlay={true}
            loop={true}
            poster="/static/AboutPreview.jpg"
          >
            {this.state.supportsVideo && (
              <source
                src="https://storage.googleapis.com/celo_whitepapers/about-video.mp4"
                type="video/mp4"
              />
            )}}
            <Image
              resizeMode="cover"
              source={{ uri: '/static/AboutPreview.jpg' }}
              style={standardStyles.image}
            />
          </Video>
        </View>
        <View style={[styles.overlay, standardStyles.centered]}>
          <VideoModal videoID="kKggE5OvyhE" ariaDescription="Video: What if money were beautiful?">
            {(onPlay) => (
              <Hoverable
                onHoverIn={this.onHoverStart}
                onHoverOut={this.onHoverEnd}
                onPress={onPlay}
              >
                <View
                  style={[
                    standardStyles.centered,
                    styles.interactive,
                    this.state.isHovering && styles.hover,
                  ]}
                >
                  <H1
                    style={[
                      textStyles.invert,
                      styles.title,
                      textStyles.center,
                      standardStyles.elementalMarginBottom,
                    ]}
                  >
                    {screen === ScreenSizes.MOBILE
                      ? t('prosperityForAllMobile')
                      : t('prosperityForAll')}
                  </H1>
                  <View
                    style={[
                      standardStyles.centered,
                      standardStyles.row,
                      standardStyles.elementalMargin,
                    ]}
                  >
                    <PlayCircle2 height={40} />
                    <H3 style={[textStyles.invert, textStyles.center, styles.subtitle]}>
                      {t('whatIfMoney')}
                    </H3>
                  </View>
                </View>
              </Hoverable>
            )}
          </VideoModal>
        </View>
      </View>
    )
  }
}

export default withNamespaces(NameSpaces.about)(withScreenSize(VideoCover))

const styles = StyleSheet.create({
  title: {
    fontSize: 64,
    lineHeight: 72,
  },
  subtitle: {
    marginLeft: 10,
  },
  interactive: {
    cursor: 'pointer',
    transitionProperty: 'transform',
    transitionDuration: '500ms',
    padding: 15,
  },
  hover: {
    transform: [{ scale: 1.015 }],
  },
  background: {
    position: 'absolute',
    width: '100vw',
    height: '100vh',
  },
  overlay: {
    height: '100%',
    width: '100%',
  },
  cover: {
    width: '100vw',
    height: '100vh',
  },
  video: {
    objectFit: 'cover',
    height: '100%',
    filter: 'saturate(0.6) brightness(0.70)',
    transitionProperty: 'filter',
    transitionDuration: '400ms',
  },
  videoHover: {
    filter: 'saturate(1) brightness(0.9)',
  },
})

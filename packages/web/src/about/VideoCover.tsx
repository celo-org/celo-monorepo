import React from 'react'
import { createElement, Image, StyleSheet, View } from 'react-native'
import { BeautifulMoneyPreview } from 'src/about/images/index'
import { H1, H3 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import Hoverable from 'src/shared/Hoverable'
import { PlayCircle2 } from 'src/shared/PlayCircle'
import VideoModal from 'src/shared/VideoModal'
import { standardStyles, textStyles } from 'src/styles'

interface State {
  hovering: boolean
}

function Video(props) {
  return createElement('video', props)
}

class VideoCover extends React.Component<I18nProps, State> {
  state: State = {
    hovering: false,
  }

  onHoverStart = () => {
    this.setState({ hovering: true })
  }
  onHoverEnd = () => {
    this.setState({ hovering: false })
  }

  render() {
    const { t } = this.props
    return (
      <View style={[styles.cover]}>
        <View style={styles.background}>
          <Video
            style={[styles.video, this.state.hovering && styles.videoHover]}
            muted={true}
            autoPlay={true}
            loop={true}
          >
            <source src="/static/AboutPreview.mp4" type="video/mp4" />
            <Image resizeMode="cover" source={BeautifulMoneyPreview} style={standardStyles.image} />
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
                    this.state.hovering && styles.hover,
                  ]}
                >
                  <H1
                    style={[textStyles.invert, styles.title, standardStyles.elementalMarginBottom]}
                  >
                    {t('prosperityForAll')}
                  </H1>
                  <View
                    style={[
                      standardStyles.centered,
                      standardStyles.row,
                      standardStyles.elementalMargin,
                    ]}
                  >
                    <PlayCircle2 height={40} />
                    <H3 style={[textStyles.invert, styles.subtitle]}>{t('whatIfMoney')}</H3>
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

export default withNamespaces(NameSpaces.about)(VideoCover)

const styles = StyleSheet.create({
  title: {
    fontSize: 64,
  },
  subtitle: {
    marginLeft: 15,
  },
  interactive: {
    cursor: 'pointer',
    transitionProperty: 'transform',
    transitionDuration: '500ms',
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
    filter: 'saturate(0.6) brightness(0.75)',
    transitionProperty: 'filter',
    transitionDuration: '400ms',
  },
  videoHover: {
    filter: 'saturate(1) brightness(0.9)',
  },
})

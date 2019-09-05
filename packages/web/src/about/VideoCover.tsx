import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { standardStyles, textStyles, fonts } from 'src/styles'
import { H1, H3 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces, NameSpaces } from 'src/i18n'
import VideoModal from 'src/shared/VideoModal'
import { BeautifulMoneyPreview } from 'src/about/images/index'
import { PlayCircle2 } from 'src/shared/PlayCircle'
import Fade from 'react-reveal/Fade'
import Hoverable from 'src/shared/Hoverable'

interface State {
  hovering: boolean
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
      <View style={[styles.cover, standardStyles.centered]}>
        <View style={styles.background}>
          <Image resizeMode="cover" source={BeautifulMoneyPreview} style={standardStyles.image} />
        </View>
        <Fade>
          <Hoverable
            onHoverIn={this.onHoverStart}
            onHoverOut={this.onHoverEnd}
            onPress={this.onPlay}
          >
            <View
              style={[
                standardStyles.centered,
                styles.interactive,
                this.state.hovering && styles.hover,
              ]}
            >
              <H1 style={[textStyles.invert, styles.title, standardStyles.elementalMarginBottom]}>
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
        </Fade>
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
    transform: [{ scale: 1.01 }],
  },
  background: {
    position: 'absolute',
    width: '100vw',
    height: '100vh',
  },
  cover: {
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
})

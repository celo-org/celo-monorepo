import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import EmailForm from 'src/forms/EmailForm'
import HomeAnimation, { Mode, styles as animationStyles } from 'src/home/HomeAnimation'
import TextAnimation from 'src/home/TextAnimation'
import { I18nProps, withNamespaces } from 'src/i18n'
import Responsive from 'src/shared/Responsive'
import { BANNER_HEIGHT, HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import { getDeviceMemory, hasGoodConnection } from 'src/utils/utils'
type Props = I18nProps

const ANIMATION_DURATION = 5

interface State {
  playing: boolean
  mode: Mode
}

class HomeCover extends React.PureComponent<Props, State> {
  state = {
    playing: false,
    mode: Mode.wait,
  }

  onLoaded = () => {
    this.setState({ playing: true })
  }

  onFinished = () => {
    this.setState({ playing: false })
  }

  componentDidMount = async () => {
    const goodConnection = await hasGoodConnection()
    this.setState({ mode: goodConnection && getDeviceMemory() >= 2 ? Mode.video : Mode.graphic })
  }

  render() {
    return (
      <Responsive large={styles.largeCover} medium={styles.mediumCover}>
        <View style={styles.smallCover}>
          <View style={styles.animationBackground}>
            <Responsive large={[styles.animationWrapper, styles.animationWrapperLargeAug]}>
              <View style={styles.animationWrapper}>
                <HomeAnimation
                  onLoaded={this.onLoaded}
                  onFinished={this.onFinished}
                  mode={this.state.mode}
                />
              </View>
            </Responsive>
          </View>
          <Responsive large={styles.largeTextHolder}>
            <View style={styles.textHolder}>
              <Responsive large={[styles.textWrapper, styles.largeTextWrapper]}>
                <View style={styles.textWrapper}>
                  <TextAnimation
                    playing={this.state.playing}
                    stillMode={this.state.mode === Mode.graphic || this.state.mode === Mode.wait}
                  />
                  <Responsive
                    large={styles.content}
                    medium={[styles.contentTablet, standardStyles.sectionMarginBottomTablet]}
                  >
                    <View style={styles.contentMobile}>
                      <View style={styles.form}>
                        <Text style={[fonts.navigation, styles.foreground]}>
                          {this.props.t('stayConnected')}
                        </Text>
                        <EmailForm
                          submitText={'Sign Up'}
                          route={'/contacts'}
                          whenComplete={<After t={this.props.t} />}
                          isDarkMode={true}
                        />
                      </View>
                    </View>
                  </Responsive>
                </View>
              </Responsive>
            </View>
          </Responsive>
        </View>
      </Responsive>
    )
  }
}

export default withNamespaces('home')(HomeCover)

function After({ t }) {
  return (
    <Text style={[fonts.h5, textStyles.center, styles.foreground]}>{t('stayConnectedThanks')}</Text>
  )
}

const styles = StyleSheet.create({
  animationWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  animationWrapperLargeAug: {
    justifyContent: 'flex-start',
  },
  stillText: {
    marginLeft: 25,
  },
  smallCover: {
    minHeight: 600,
    marginTop: HEADER_HEIGHT,
    height: '100vh',
    maxHeight: 800,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.dark,
  },
  mediumCover: {
    minHeight: 600,
    paddingTop: BANNER_HEIGHT,
    marginTop: HEADER_HEIGHT,
    height: 'max-contents',
    maxHeight: '100vh',
    justifyContent: 'flex-end',
    backgroundColor: colors.dark,
  },
  largeCover: {
    paddingTop: HEADER_HEIGHT + BANNER_HEIGHT,
    minHeight: '100vh',
    height: '100vh',
    maxHeight: '100vh',
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.dark,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    paddingHorizontal: 25,
    alignSelf: 'flex-end',
    maxWidth: 500,
    width: '100%',
  },
  contentTablet: {
    maxWidth: 500,
    width: '100%',
    flexDirection: 'column',
    paddingHorizontal: 30,
    paddingTop: 30,
    alignSelf: 'center',
  },
  contentMobile: {
    flexDirection: 'column',
    paddingHorizontal: 30,
    paddingVertical: 30,
    alignItems: 'center',
  },
  form: {
    width: '100%',
    alignItems: 'flex-start',
  },
  foreground: {
    color: colors.white,
  },
  textHolder: {
    flex: 1,
    height: 'contents',
  },
  textWrapper: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  largeTextWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 65,
  },
  largeTextHolder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  textContainer: {
    flexDirection: 'column',
  },
  textContainerLarge: {
    flexDirection: 'row',
    marginLeft: 25,
  },
  white: {
    color: colors.white,
  },
  word: {
    width: 220,
  },
  animationBackground: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    maxWidth: '100vw',
  },
  letsMake: {
    textAlign: 'center',
    zIndex: 1,
  },
  mask: {
    bottom: 0,
    left: 0,
    right: -30,
    top: 0,
    backgroundImage: `linear-gradient(90deg, rgba(46,51,56,1) 0%, rgba(46,51,56,1) 90%, rgba(46,51,56,0) 100%)`,
    position: 'absolute',
    animationDuration: `${ANIMATION_DURATION}s`,
    animationIterationCount: 1,
    animationKeyframes: [
      {
        '0%': {
          transform: [
            {
              translateX: '-100%',
            },
          ],
        },
        '80%': {
          transform: [
            {
              translateX: '-100%',
            },
          ],
        },
        '90%': {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
        '100%': {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
      },
    ],
  },
  mask2: {
    bottom: 0,
    left: -20,
    right: 0,
    top: 0,
    backgroundImage: `linear-gradient(90deg, rgba(46,51,56,0) 0%, rgba(46,51,56,1) 10%, rgba(46,51,56,1) 100%)`,
    position: 'absolute',
    animationDuration: `${ANIMATION_DURATION}s`,
    animationIterationCount: 1,
    animationKeyframes: [
      {
        '0%': {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
        '12%': {
          transform: [
            {
              translateX: '100%',
            },
          ],
        },
        '100%': {
          transform: [
            {
              translateX: '100%',
            },
          ],
        },
      },
    ],
  },
})

import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import EmailForm from 'src/forms/EmailForm'
import HomeAnimation from 'src/home/HomeAnimation'
import TextAnimation from 'src/home/TextAnimation'
import { I18nProps, withNamespaces } from 'src/i18n'
import Responsive from 'src/shared/Responsive'
import { HEADER_HEIGHT, MENU_MAX_WIDTH } from 'src/shared/Styles'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

type Props = I18nProps

const ANIMATION_DURATION = 5

function After({ t }) {
  return (
    <Text style={[fonts.h5, textStyles.center, styles.foreground]}>{t('stayConnectedThanks')}</Text>
  )
}

class HomeCover extends React.PureComponent<Props> {
  state = {
    playing: false,
  }

  onLoaded = () => {
    this.setState({ playing: true })
  }

  onFinished = () => {
    this.setState({ playing: false })
  }

  render() {
    return (
      <Responsive medium={styles.mediumCover}>
        <View style={styles.smallCover}>
          <View style={styles.animationBackground}>
            <Responsive large={[styles.animationWrapper, { justifyContent: 'flex-start' }]}>
              <View style={styles.animationWrapper}>
                <HomeAnimation onLoaded={this.onLoaded} onFinished={this.onFinished} />
              </View>
            </Responsive>
          </View>
          <View style={styles.textHolder}>
            <Responsive large={[styles.textWrapper, styles.largeTextWrapper]}>
              <View style={styles.textWrapper}>
                <Fade bottom={true} distance="20px">
                  <TextAnimation playing={this.state.playing} />
                </Fade>
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
        </View>
      </Responsive>
    )
  }
}

export default withNamespaces('home')(HomeCover)

const styles = StyleSheet.create({
  animationWrapper: {
    flex: 1,
    maxWidth: MENU_MAX_WIDTH,
    justifyContent: 'center',
  },
  smallCover: {
    minHeight: 600,
    height: '100vh',
    maxHeight: 700,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.dark,
  },
  mediumCover: {
    height: '100vh',
    minHeight: 800,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    flexDirection: 'column',
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
    marginTop: HEADER_HEIGHT,
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

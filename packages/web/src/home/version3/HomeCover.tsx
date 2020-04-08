import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import EmailForm from 'src/forms/EmailForm'
import HomeAnimation, { Mode } from 'src/home/HomeAnimation'
import TextAnimation from 'src/home/TextAnimation'
import { I18nProps, withNamespaces } from 'src/i18n'
import Responsive from 'src/shared/Responsive'
import { BANNER_HEIGHT, HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, fonts, standardStyles } from 'src/styles'
import { getDeviceMemory, hasGoodConnection } from 'src/utils/utils'
type Props = I18nProps

interface State {
  playing: boolean
  mode: Mode
}

const DURATION = 3000

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

  setStill = () => {
    this.setState({ mode: Mode.graphic, playing: false })
  }

  componentDidMount = async () => {
    const goodConnection = await hasGoodConnection()

    if (!goodConnection || getDeviceMemory() <= 2) {
      this.setState({ mode: Mode.graphic })
    } else {
      this.setState({ mode: Mode.transition })
      setTimeout(() => {
        this.setState({ mode: Mode.video })
      }, DURATION)
    }
  }

  render() {
    const { mode } = this.state
    return (
      <Responsive large={styles.largeCover} medium={styles.mediumCover}>
        <View style={styles.smallCover}>
          <View style={styles.animationBackground}>
            <Responsive large={[styles.animationWrapper, styles.animationWrapperLargeAug]}>
              <View style={styles.animationWrapper}>
                <HomeAnimation
                  onLoaded={this.onLoaded}
                  onFinished={this.onFinished}
                  onError={this.setStill}
                  mode={mode}
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
                    willTransition={mode === Mode.transition}
                    stillMode={
                      mode === Mode.wait || mode === Mode.transition || mode === Mode.graphic
                    }
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
                        <EmailForm submitText={'Sign Up'} route={'/contacts'} isDarkMode={true} />
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

const styles = StyleSheet.create({
  animationWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  animationWrapperLargeAug: {
    justifyContent: 'flex-start',
    marginTop: 20,
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
  animationBackground: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    maxWidth: '100vw',
  },
})

import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import FullCircle from 'src/community/connect/FullCircle'
import { H1 } from 'src/fonts/Fonts'
import EmailForm, { After } from 'src/forms/EmailForm'
import { I18nProps, withNamespaces } from 'src/i18n'
import Arrow from 'src/icons/Arrow'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

type Props = ScreenProps & I18nProps
class CoverArea extends React.PureComponent<Props> {
  render() {
    const { screen, t } = this.props
    const isDesktop = screen === ScreenSizes.DESKTOP
    return (
      <View style={styles.darkBackground}>
        <View style={[standardStyles.centered, styles.fullScreen]}>
          <View style={[standardStyles.centered, styles.aboveFold]}>
            <View style={circleContainerStyle(screen)}>
              <FadeIn duration={0} unmountIfInvisible={true}>
                {(load) => <FullCircle init={load} />}
              </FadeIn>
              <View
                style={[
                  standardStyles.centered,
                  isDesktop ? styles.fourWords : styles.fourWordsMobile,
                ]}
              >
                <Text style={fonts.specialOneOff}>
                  <Text style={styles.greenColor}>Developers. </Text>
                  <Text style={styles.purpleColor}>Designers. </Text>
                </Text>
                <Text style={fonts.specialOneOff}>
                  <Text style={styles.redColor}>Dreamers. </Text>
                  <Text style={styles.blueColor}>Doers. </Text>
                </Text>
              </View>
            </View>
          </View>
          <View
            style={[styles.arrow, isDesktop ? styles.arrowLargeScreen : styles.arrowSmallScreen]}
          >
            <Arrow color={colors.placeholderDarkMode} size={isDesktop ? 36 : 24} />
          </View>
        </View>

        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={standardStyles.sectionMarginBottom}
          tabletStyle={standardStyles.sectionMarginBottomTablet}
          mobileStyle={standardStyles.sectionMarginBottomMobile}
        >
          <Cell span={Spans.half}>
            <Fade bottom={true} distance={'80px'}>
              <View style={[standardStyles.centered, isDesktop && styles.ctArea]}>
                <H1
                  style={[
                    textStyles.invert,
                    textStyles.center,
                    standardStyles.elementalMarginBottom,
                  ]}
                >
                  {t('cover.title')}
                </H1>
                <Text style={[fonts.p, textStyles.invert, styles.formName]}>
                  {t('cover.joinMovement')}
                </Text>
                <EmailForm
                  submitText={t('signUp')}
                  route={'/contacts'}
                  whenComplete={<After t={t} />}
                  isDarkMode={true}
                />
              </View>
            </Fade>
          </Cell>
        </GridRow>
      </View>
    )
  }
}

function circleContainerStyle(screen: ScreenSizes) {
  switch (screen) {
    case ScreenSizes.DESKTOP:
      return styles.circleContainerLarge
    case ScreenSizes.TABLET:
      return styles.circleContainerMedium
    default:
      return styles.circleContainer
  }
}

const styles = StyleSheet.create({
  fullScreen: {
    width: '100vw',
    height: '100vh',
  },
  aboveFold: { justifyContent: 'space-around', width: '100%', padding: 20 },
  darkBackground: {
    backgroundColor: colors.dark,
  },
  greenColor: {
    color: colors.primary,
  },
  redColor: {
    color: colors.red,
  },
  blueColor: {
    color: colors.lightBlue,
  },
  purpleColor: {
    color: colors.purple,
  },
  fourWords: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  fourWordsMobile: {
    width: '100%',
    marginTop: 50,
  },
  circleContainer: {
    width: '100%',
  },
  circleContainerMedium: {
    width: '80vw',
    maxHeight: '70vh',
  },
  circleContainerLarge: {
    width: '73vh',
    maxWidth: '75vw',
    maxHeight: '80vh',
  },
  ctArea: {
    paddingHorizontal: 65,
    marginBottom: 50,
  },
  formName: {
    marginVertical: 10,
  },
  arrowLargeScreen: {
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 20,
    right: 80,
  },
  arrowSmallScreen: {
    bottom: -60,
    marginTop: 10,
    alignSelf: 'center',
  },
  arrow: {
    animationDuration: `4s`,
    animationDelay: '3s',
    animationFillMode: 'both',
    animationIterationCount: '8',
    animationKeyframes: [
      {
        '0%': {
          opacity: 0,
          transform: [{ translate3d: '0, -300%, 0' }],
        },
        '30%': {
          opacity: 1,
        },
        '100%': {
          opacity: 0,
          transform: [{ translate3d: '0, -100%, 0' }],
        },
      },
    ],
  },
})

export default withNamespaces('community')(withScreenSize(CoverArea))

import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H2, H3 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Fade from 'src/shared/AwesomeFade'
import HollowOval from 'src/shared/HollowOval'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
class ThreePillars extends React.PureComponent<I18nProps & ScreenProps> {
  render() {
    const { t, screen } = this.props
    const isMobile = screen === ScreenSizes.MOBILE

    return (
      <View style={styles.container}>
        <GridRow
          desktopStyle={standardStyles.sectionMargin}
          tabletStyle={standardStyles.sectionMarginTablet}
          mobileStyle={standardStyles.sectionMarginMobile}
          allStyle={standardStyles.centered}
        >
          <Cell span={Spans.half} style={!isMobile && styles.textArea}>
            <H3 style={isMobile && textStyles.center}>{t('threePillars')}</H3>
            <H2
              style={[
                standardStyles.elementalMargin,
                styles.emphasis,
                isMobile && textStyles.center,
              ]}
            >
              {t('selfMgmtWholeness')}
            </H2>
            <Text style={[fonts.p, isMobile && textStyles.center]}>{t('guidedBy')}</Text>
          </Cell>
          <Cell span={Spans.half}>
            <AnimationContainer />
          </Cell>
        </GridRow>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
  },
  textArea: {
    paddingRight: 60,
  },
  emphasis: {
    color: colors.deepBlue,
  },
  illustration: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  illustrationMobile: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  movingCoin: {
    position: 'absolute',
    opacity: 1,
    // keeps it so that the mix-blend-mode svg blends after animation, otherwise it disapears on Chrome for Android on Pixel 3
    willChange: 'opacity',
  },
  coinArea: {
    marginVertical: 80,
  },
  coinAreaMobile: {
    marginHorizontal: 0,
    marginVertical: 60,
  },
})

export default withNamespaces('jobs')(withScreenSize(ThreePillars))

class Animation extends React.PureComponent<ScreenProps> {
  getCoinsSize = () => {
    switch (this.props.screen) {
      case ScreenSizes.MOBILE:
        return 90
      case ScreenSizes.TABLET:
        return 75
      default:
        return 150
    }
  }

  render() {
    const baseDelay = 400
    const coinsSize = this.getCoinsSize()
    const isMobile = this.props.screen === ScreenSizes.MOBILE
    const areaStyle = isMobile ? styles.coinAreaMobile : styles.coinArea
    const ratio = 0.88
    return (
      <View
        style={[
          isMobile ? styles.illustrationMobile : styles.illustration,
          { paddingHorizontal: isMobile ? 0 : (coinsSize * ratio) / 2.5 },
        ]}
      >
        <View style={areaStyle}>
          <OvalCoin color={colors.primary} size={coinsSize} />
          <View
            style={[
              styles.movingCoin,
              { mixBlendMode: 'multiply', top: coinsSize / 3, left: (-coinsSize * ratio) / 6 },
            ]}
          >
            <Fade distance={`${coinsSize / 3}px`} delay={baseDelay}>
              <HollowOval color={colors.deepBlue} size={coinsSize} />
            </Fade>
          </View>
        </View>
        <View style={areaStyle}>
          <OvalCoin color={colors.primary} size={coinsSize} />

          <View
            style={[
              styles.movingCoin,
              // mixBlendMode get stripped out when used in stylesheet
              { mixBlendMode: 'multiply', top: 0 },
            ]}
          >
            <Fade distance={`${coinsSize / 4}px`} delay={baseDelay * 2}>
              <OvalCoin color={colors.deepBlue} size={coinsSize} />
            </Fade>
          </View>
        </View>
        <View style={areaStyle}>
          <OvalCoin color={colors.primary} size={coinsSize} />
          <View
            style={[
              styles.movingCoin,
              { mixBlendMode: 'multiply', top: -coinsSize / 2, left: (coinsSize * ratio) / 3 },
            ]}
          >
            <Fade distance={`${coinsSize / 5}px`} delay={baseDelay * 3}>
              <OvalCoin color={colors.deepBlue} size={coinsSize} />
            </Fade>
          </View>
        </View>
      </View>
    )
  }
}

const AnimationContainer = withScreenSize(Animation)

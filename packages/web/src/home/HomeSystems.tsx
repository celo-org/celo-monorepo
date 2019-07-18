import * as React from 'react'
import LazyLoad from 'react-lazyload'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H2 } from 'src/fonts/Fonts'
import Cyclone from 'src/home/Cyclone'
import { PARTNERSHIP_ID } from 'src/home/version3/HomeEmail'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import Button, { BTN } from 'src/shared/Button.3'
import Responsive from 'src/shared/Responsive'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import { scrollTo } from 'src/utils/utils'
import analytics from '../analytics/analytics'
const builtOn = require('src/home/version3/builtOn.png')
const groupVerify = require('src/home/version3/groupVerify.png')
const mobileFirst = require('src/home/version3/mobileFirst.png')

type Props = I18nProps & ScreenProps

const downloadWhitePaper = (link, name) => {
  window.open(link, `_${name}`)
  analytics.track(`${name} opened`)
}

const onWhitePaperPress = () => {
  downloadWhitePaper(
    'https://storage.googleapis.com/celo_whitepapers/Celo__A_Multi_Asset_Cryptographic_Protocol_for_Decentralized_Social_Payments.pdf',
    'white_paper'
  )
}
const onStabilityPress = () => {
  downloadWhitePaper(
    'https://storage.googleapis.com/celo_whitepapers/Celo_Stability_Analysis.pdf',
    'stability'
  )
}

const onLearnMorePress = () => {
  scrollTo(PARTNERSHIP_ID)
}

class HomeSystems extends React.PureComponent<Props> {
  render() {
    const { t, screen } = this.props
    return (
      <View style={styles.background}>
        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={[standardStyles.sectionMarginTop, styles.avoidLogo]}
          tabletStyle={standardStyles.sectionMarginTopTablet}
          mobileStyle={standardStyles.sectionMarginTopMobile}
        >
          <Cell span={Spans.three4th} tabletSpan={Spans.three4th}>
            <Fade bottom={true} distance="20px">
              <View>
                <H2
                  accessibilityRole={'heading'}
                  style={[styles.white, textStyles.center, styles.margin, styles.maxWidth]}
                >
                  {t('systemsApproach')}
                </H2>
                <H2 accessibilityRole={'heading'} style={[styles.white, textStyles.center]}>
                  {t('designedWithCommunities')}
                </H2>
              </View>
            </Fade>
          </Cell>
        </GridRow>
        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={standardStyles.blockMargin}
          tabletStyle={standardStyles.blockMarginTablet}
          mobileStyle={standardStyles.blockMarginMobile}
        >
          <Cell span={Spans.three4th}>
            <Cyclone />
          </Cell>
        </GridRow>
        <Fade bottom={true} distance="20px">
          <View style={standardStyles.centered}>
            <GridRow
              desktopStyle={[standardStyles.blockMarginBottom, styles.avoidLogo]}
              tabletStyle={standardStyles.blockMarginBottomTablet}
              mobileStyle={standardStyles.blockMarginBottomMobile}
            >
              <Cell span={Spans.fourth}>
                <Text style={[fonts.superLarge, styles.foreground]}>1</Text>
              </Cell>
              <Cell span={Spans.half}>
                <Text style={[fonts.h3, textStyles.heading, styles.foreground]}>
                  {t('buildOnCelo')}
                </Text>
                <Text style={[fonts.p, styles.foreground]}>{t('buildOnCeloCopy')}</Text>
                <View style={standardStyles.elementalMargin}>
                  <Button text={t('learnMore')} kind={BTN.NAKED} onPress={onLearnMorePress} />
                </View>
              </Cell>
              <Cell span={Spans.fourth}>
                <Stencil source={builtOn} height={125} />
              </Cell>
            </GridRow>
          </View>
        </Fade>
        <Fade bottom={true} distance="20px" delay={150}>
          <View style={standardStyles.centered}>
            <GridRow
              desktopStyle={[standardStyles.blockMarginBottom, styles.avoidLogo]}
              tabletStyle={standardStyles.blockMarginBottomTablet}
              mobileStyle={standardStyles.blockMarginBottomMobile}
            >
              <Cell span={Spans.fourth}>
                <Text style={[fonts.superLarge, styles.foreground]}>2</Text>
              </Cell>
              <Cell span={Spans.half}>
                <Text style={[fonts.h3, textStyles.heading, styles.foreground]}>
                  {t('verifyToEarn')}
                </Text>
                <Text style={[fonts.p, styles.foreground]}>{t('verifyToEarnCopy')}</Text>
              </Cell>
              <Cell span={Spans.fourth}>
                <Stencil source={groupVerify} height={125} />
              </Cell>
            </GridRow>
          </View>
        </Fade>
        <Fade bottom={true} distance="20px" delay={300}>
          <View style={standardStyles.centered}>
            <GridRow
              desktopStyle={[standardStyles.blockMarginBottom, styles.avoidLogo]}
              tabletStyle={standardStyles.blockMarginBottomTablet}
              mobileStyle={standardStyles.blockMarginBottomMobile}
            >
              <Cell span={Spans.fourth}>
                <Text style={[fonts.superLarge, styles.foreground]}>3</Text>
              </Cell>
              <Cell span={Spans.half}>
                <Text style={[fonts.h3, textStyles.heading, styles.foreground]}>
                  {t('mobileFirstPlatform')}
                </Text>
                <Text style={[fonts.p, styles.foreground]}>{t('mobileFirstPlatformCopy')}</Text>
              </Cell>
              <Cell span={Spans.fourth}>
                <Stencil source={mobileFirst} height={125} />
              </Cell>
            </GridRow>
          </View>
        </Fade>
        <GridRow
          desktopStyle={[standardStyles.sectionMarginBottom, styles.avoidLogo]}
          tabletStyle={[standardStyles.sectionMarginBottomTablet]}
          mobileStyle={[standardStyles.sectionMarginBottomMobile, standardStyles.centered]}
          allStyle={styles.fitContent}
        >
          <Cell span={Spans.half} style={styles.whitePaperCell}>
            <Fade bottom={true} distance="20px">
              <Responsive medium={[styles.technicalPaper]}>
                <View style={styles.technicalPaperMobile}>
                  <Responsive medium={[fonts.h3, textStyles.heading, styles.foreground]}>
                    <Text
                      style={[fonts.h3, textStyles.heading, styles.foreground, textStyles.center]}
                    >
                      {t('whitePaper')}
                    </Text>
                  </Responsive>
                  <Responsive medium={[fonts.p, styles.foreground]}>
                    <Text style={[fonts.p, styles.foreground, textStyles.center]}>
                      {t('whitepaperCopy')}
                    </Text>
                  </Responsive>
                  <Responsive medium={styles.button}>
                    <View style={[styles.button, standardStyles.centered]}>
                      <DownLoadButton t={t} screen={screen} onPress={onWhitePaperPress} />
                    </View>
                  </Responsive>
                </View>
              </Responsive>
            </Fade>
          </Cell>
          <Cell span={Spans.half} style={styles.whitePaperCell}>
            <Fade bottom={true} distance="20px">
              <Responsive medium={[styles.technicalPaper, styles.technicalPaperEnd]}>
                <View style={styles.technicalPaperMobile}>
                  <View>
                    <Responsive medium={[fonts.h3, textStyles.heading, styles.foreground]}>
                      <Text
                        style={[
                          fonts.h3,
                          textStyles.heading,
                          styles.foreground,
                          textStyles.center,
                          standardStyles.blockMarginTopMobile,
                        ]}
                      >
                        {t('stabilityAnalysis')}
                      </Text>
                    </Responsive>
                    <Responsive medium={[fonts.p, styles.foreground]}>
                      <Text style={[fonts.p, styles.foreground, textStyles.center]}>
                        {t('stabilityAnalysisCopy')}
                      </Text>
                    </Responsive>
                  </View>
                  <Responsive medium={styles.button}>
                    <View style={[styles.button, standardStyles.centered]}>
                      <DownLoadButton t={t} screen={screen} onPress={onStabilityPress} />
                    </View>
                  </Responsive>
                </View>
              </Responsive>
            </Fade>
          </Cell>
        </GridRow>
      </View>
    )
  }
}

function DownLoadButton({ onPress, screen, t }) {
  return (
    <Button
      text={t('downloadPDF')}
      kind={BTN.PRIMARY}
      onPress={onPress}
      align={screen === ScreenSizes.MOBILE ? 'center' : 'flex-start'}
    />
  )
}

interface StencilProps {
  height: number
  source: ImageSourcePropType
}
const STENCIL_WIDTH = 202.71
const STENCIL_HEIGHT = 224
function Stencil({ height, source }: StencilProps) {
  return (
    <LazyLoad height={height}>
      <AspectRatio ratio={STENCIL_HEIGHT / STENCIL_WIDTH} style={{ minHeight: height }}>
        <Image source={source} style={styles.stencil} resizeMode="contain" />
      </AspectRatio>
    </LazyLoad>
  )
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.dark,
  },
  avoidLogo: {
    paddingHorizontal: 70,
  },
  foreground: {
    color: colors.gray,
  },
  white: {
    color: colors.white,
  },
  technicalPaperMobile: {
    flex: 1,
  },
  technicalPaper: {
    maxWidth: 445,
    justifyContent: 'space-between',
    flex: 1,
  },
  technicalPaperEnd: {
    alignSelf: 'flex-end',
  },
  button: {
    marginTop: 20,
  },
  stencil: {
    height: '100%',
    width: '100%',
  },
  margin: {
    marginBottom: 40,
  },
  maxWidth: {
    maxWidth: '85vw',
  },
  whitePaperCell: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 'auto',
  },
  fitContent: {
    minHeight: 'auto',
  },
})

export default withNamespaces('home')(withScreenSize(HomeSystems))

import * as React from 'react'
import { Slide } from 'react-awesome-reveal'
import { StyleSheet, View } from 'react-native'
import analytics from 'src/analytics/analytics'
import { H2, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, standardStyles, textStyles } from 'src/styles'

async function downloadBenefits() {
  await analytics.track(`benefits.pdf download`)
}

type Props = I18nProps

class Benefits extends React.PureComponent<Props> {
  render() {
    const { t } = this.props
    return (
      <>
        <GridRow>
          <Cell span={Spans.full}>
            <CoinLine />
          </Cell>
        </GridRow>
        <GridRow
          allStyle={[standardStyles.centered]}
          mobileStyle={[standardStyles.sectionMarginMobile]}
          tabletStyle={[standardStyles.sectionMarginTablet]}
          desktopStyle={standardStyles.sectionMargin}
        >
          <Cell span={Spans.half} style={[standardStyles.centered, styles.box]}>
            <H2 style={[standardStyles.elementalMargin, textStyles.center]}>
              {t('weGotYouCovered')}
            </H2>
            <H4 style={[standardStyles.elementalMarginBottom, textStyles.center]}>
              {t('comprehensiveBenefits')}
            </H4>
            <Button
              size={SIZE.big}
              kind={BTN.PRIMARY}
              text={t('viewBenefits')}
              href={'https://storage.googleapis.com/celo_whitepapers/celo-perks-benefits.pdf'}
              target={'_blank'}
              onPress={downloadBenefits}
              align={'center'}
            />
          </Cell>
        </GridRow>
      </>
    )
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: 500,
  },
  icon: {
    flex: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
  },
})

export default withNamespaces('jobs')(Benefits)

const sizeOfSlidingOval = 30
const coins = [colors.purple, colors.red, colors.lightBlue, colors.gold, colors.primary]
function CoinLine() {
  return (
    <View style={rainBowStyles.centerItems}>
      <Slide direction="right" cascade={true}>
        <View style={rainBowStyles.coinLineGroup}>
          {coins.map((color, index) => {
            const overlap = (index * sizeOfSlidingOval) / 2
            const startingPosition =
              ((-sizeOfSlidingOval / 2) * coins.length) / 2 - sizeOfSlidingOval / coins.length
            return (
              <View
                key={color}
                style={[
                  rainBowStyles.slideingCoin,
                  {
                    mixBlendMode: 'multiply',
                    animationKeyframes: [
                      {
                        from: {
                          opacity: 0,
                          transform: `translateX(calc(-${sizeOfSlidingOval *
                            coins.length}px - ${overlap}px))`,
                        },
                      },
                    ],
                  },
                ]}
              >
                <div
                  style={{
                    left: startingPosition + overlap,
                    position: 'absolute',
                  }}
                >
                  <OvalCoin color={color} size={sizeOfSlidingOval} />
                  {color === colors.primary && <View style={rainBowStyles.greenLine} />}
                </div>
              </View>
            )
          })}
        </View>
      </Slide>
    </View>
  )
}

const rainBowStyles = StyleSheet.create({
  coinLineContainer: {
    backgroundColor: colors.gray,
    maxWidth: '100vw',
    overflow: 'hidden',
  },
  coinLineGroup: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  greenLine: {
    margin: 0,
    display: 'flex',
    height: 3,
    width: '70vw',
    zIndex: -10,
    backgroundColor: colors.primary,
    // @ts-ignore
    transform: [{ translateX: `calc(-70vw + 10px)` }, { translateY: -sizeOfSlidingOval * 0.7 }],
  },
  centerItems: {
    alignItems: 'center',
  },
  slideingCoin: {
    opacity: 0.9,
    // @ts-ignore // keeps it so that the mix-blend-mode svg blends after animation, otherwise it disapears on Chrome for Android on Pixel 3
    willChange: 'opacity',
    animationDuration: '2s',
    animationTimingFunction: 'cubic-bezier(.53,.01,.53,.98)',
  },
})

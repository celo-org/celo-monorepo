import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Feature from 'src/dev/Feature'
import { H3 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Fade from 'src/shared/AwesomeFade'
import { hashNav } from 'src/shared/menu-items'
import { colors, standardStyles, textStyles } from 'src/styles'
const stableImg = require('src/dev/features/stable.png')
const pkiImg = require('src/dev/features/pki.png')
const govImg = require('src/dev/features/gov.png')
const stakeImg = require('src/dev/features/stake.png')
const custodyImg = require('src/dev/features/custody.png')
const ultraImg = require('src/dev/features/ultra.png')
const gasImg = require('src/dev/features/gas.png')
const evmImg = require('src/dev/features/evm.png')

type Props = I18nProps

export default withNamespaces('dev')(
  React.memo(function Features({ t }: Props) {
    return (
      <View style={styles.darkBackground}>
        <Fade distance={'40px'}>
          <View nativeID={hashNav.build.features}>
            <GridRow
              desktopStyle={standardStyles.sectionMarginTop}
              tabletStyle={standardStyles.sectionMarginTopTablet}
              mobileStyle={standardStyles.sectionMarginTopMobile}
            >
              <Cell span={Spans.full}>
                <H3 style={textStyles.invert}>{t('featureTitle')}</H3>
              </Cell>
            </GridRow>
            <GridRow
              allStyle={styles.featuresContainer}
              desktopStyle={standardStyles.sectionMarginBottom}
              tabletStyle={standardStyles.sectionMarginBottomTablet}
              mobileStyle={[standardStyles.sectionMarginBottomMobile, styles.featuresMobile]}
            >
              <Cell span={Spans.third} tabletSpan={Spans.half} mobileSpan={Spans.full}>
                <Feature
                  title={t('feat.stableValueCurrencies')}
                  graphic={stableImg}
                  text={t('feat.stableText')}
                />
              </Cell>
              <Cell span={Spans.third} tabletSpan={Spans.half} mobileSpan={Spans.full}>
                <Feature title={t('feat.phonePKI')} graphic={pkiImg} text={t('feat.pkiText')} />
              </Cell>
              <Cell span={Spans.third} tabletSpan={Spans.half} mobileSpan={Spans.full}>
                <Feature title={t('feat.onChainGov')} graphic={govImg} text={t('feat.govText')} />
              </Cell>

              <Cell span={Spans.third} tabletSpan={Spans.half} mobileSpan={Spans.full}>
                <Feature
                  title={t('feat.selfCustody')}
                  graphic={custodyImg}
                  text={t('feat.custodyText')}
                />
              </Cell>
              <Cell span={Spans.third} tabletSpan={Spans.half} mobileSpan={Spans.full}>
                <Feature
                  title={t('feat.proofOfStake')}
                  graphic={stakeImg}
                  text={t('feat.stakeText')}
                />
              </Cell>
              <Cell span={Spans.third} tabletSpan={Spans.half} mobileSpan={Spans.full}>
                <Feature
                  title={t('feat.fastUltraLight')}
                  graphic={ultraImg}
                  text={t('feat.ultraText')}
                />
              </Cell>
              <Cell span={Spans.third} tabletSpan={Spans.half} mobileSpan={Spans.full}>
                <Feature
                  title={t('feat.gasMultiCurrency')}
                  graphic={gasImg}
                  text={t('feat.gasText')}
                />
              </Cell>
              <Cell span={Spans.third} tabletSpan={Spans.half} mobileSpan={Spans.full}>
                <Feature
                  title={t('feat.programmable')}
                  graphic={evmImg}
                  text={t('feat.programmableText')}
                />
              </Cell>
            </GridRow>
          </View>
        </Fade>
      </View>
    )
  })
)

const styles = StyleSheet.create({
  featuresMobile: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  darkBackground: {
    backgroundColor: colors.dark,
  },
  featuresContainer: { flexWrap: 'wrap' },
})

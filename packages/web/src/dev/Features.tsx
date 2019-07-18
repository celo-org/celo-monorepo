import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Feature from 'src/dev/Feature'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Title from './Title'
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
  memo(function Features({ t }: Props) {
    return (
      <Fade bottom={true} distance={'40px'}>
        <View>
          <Title invert={true} title={t('featureTitle')} />
          <GridRow mobileStyle={styles.featuresMobile}>
            <Cell span={Spans.fourth} mobileSpan={Spans.half}>
              <Feature
                title={t('feat.stableValueCurrencies')}
                graphic={stableImg}
                text={t('feat.stableText')}
              />
            </Cell>
            <Cell span={Spans.fourth} mobileSpan={Spans.half}>
              <Feature title={t('feat.phonePKI')} graphic={pkiImg} text={t('feat.pkiText')} />
            </Cell>
            <Cell span={Spans.fourth} mobileSpan={Spans.half}>
              <Feature title={t('feat.onChainGov')} graphic={govImg} text={t('feat.govText')} />
            </Cell>
            <Cell span={Spans.fourth} mobileSpan={Spans.half}>
              <Feature
                title={t('feat.proofOfStake')}
                graphic={stakeImg}
                text={t('feat.stakeText')}
              />
            </Cell>
          </GridRow>
          <GridRow mobileStyle={styles.featuresMobile}>
            <Cell span={Spans.fourth} mobileSpan={Spans.half}>
              <Feature
                title={t('feat.selfCustody')}
                graphic={custodyImg}
                text={t('feat.custodyText')}
              />
            </Cell>
            <Cell span={Spans.fourth} mobileSpan={Spans.half}>
              <Feature
                title={t('feat.fastUltraLight')}
                graphic={ultraImg}
                text={t('feat.ultraText')}
              />
            </Cell>
            <Cell span={Spans.fourth} mobileSpan={Spans.half}>
              <Feature
                title={t('feat.gasMultiCurrency')}
                graphic={gasImg}
                text={t('feat.gasText')}
              />
            </Cell>
            <Cell span={Spans.fourth} mobileSpan={Spans.half}>
              <Feature
                title={t('feat.programmable')}
                graphic={evmImg}
                text={t('feat.programmableText')}
              />
            </Cell>
          </GridRow>
        </View>
      </Fade>
    )
  })
)

const styles = StyleSheet.create({
  featuresMobile: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
})

import getConfig from 'next/config'
import { StyleSheet, View } from 'react-native'
import QuarterCircle from 'src/community/connect/QuarterCircle'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import { hashNav } from 'src/shared/menu-items'
import { colors, standardStyles, textStyles } from 'src/styles'

function Contribute({ t }: I18nProps) {
  return (
    <View
      nativeID={hashNav.connect.fellowship}
      style={[styles.darkBackground, styles.keepOnScreen]}
    >
      <GridRow mobileStyle={[styles.proposalArea, standardStyles.blockMarginBottomTablet]}>
        <Cell span={Spans.half} style={styles.verticalCenter}>
          <View style={styles.proposalText}>
            <H2 style={[textStyles.invert, standardStyles.elementalMarginBottom]}>
              {t(
                `contribute.${getConfig().publicRuntimeConfig.FLAGS.ECOFUND ? 'title' : 'oldTitle'}`
              )}
            </H2>
            <Button
              kind={BTN.NAKED}
              text={t('contribute.button')}
              target={'_cfp'}
              href={'https://medium.com/celohq/call-for-proposals-the-celo-fellowship-3c43b06b10f9'}
            />
          </View>
        </Cell>
        <Cell span={Spans.half} style={styles.maskedCircle}>
          <QuarterCircle />
        </Cell>
      </GridRow>
    </View>
  )
}

export default withNamespaces(NameSpaces.community)(Contribute)

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: colors.dark,
  },
  maskedCircle: {
    paddingTop: 0,
    paddingLeft: 100,
  },
  keepOnScreen: {
    overflow: 'hidden',
    maxWidth: '100vw',
  },
  proposalArea: { flexDirection: 'column-reverse' },
  proposalText: { paddingLeft: '4%' },
  verticalCenter: { justifyContent: 'center' },
})

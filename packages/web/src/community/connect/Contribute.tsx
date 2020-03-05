import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import QuarterCircle from 'src/community/connect/QuarterCircle'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { colors, standardStyles, textStyles } from 'src/styles'

function Contribute({ t }: I18nProps) {
  return (
    <View style={[styles.darkBackground, styles.keepOnScreen]}>
      <GridRow mobileStyle={[styles.proposalArea, standardStyles.blockMarginBottomTablet]}>
        <Cell span={Spans.half} style={styles.verticalCenter}>
          <View style={styles.proposalText}>
            <H2 style={[textStyles.invert, standardStyles.elementalMarginBottom]}>
              {t(`contribute.title`)}
            </H2>
            <Button
              kind={BTN.NAKED}
              size={SIZE.normal}
              text={t('contribute.button')}
              target={'_cfp'}
              href={
                'https://medium.com/celoOrg/call-for-proposals-the-celo-fellowship-3c43b06b10f9'
              }
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

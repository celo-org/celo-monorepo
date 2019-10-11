import { StyleSheet, View } from 'react-native'
import * as React from 'react'
import QuarterCircle from 'src/community/connect/QuarterCircle'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { colors, standardStyles, textStyles } from 'src/styles'
import { withScreenSize, ScreenProps } from 'src/layout/ScreenSize'

function FellowCover({ t, isMobile }: I18nProps & ScreenProps) {
  return (
    <View style={[styles.darkBackground, styles.keepOnScreen]}>
      <GridRow mobileStyle={[styles.proposalArea, standardStyles.blockMarginBottomTablet]}>
        <Cell span={Spans.half} style={styles.verticalCenter}>
          <View style={styles.proposalText}>
            <H2 style={[textStyles.invert, standardStyles.elementalMarginBottom]}>
              {t(`coverTitle`)}
            </H2>
            <Button
              kind={BTN.NAKED}
              size={SIZE.normal}
              text={t('coverBtn')}
              target={'_cfp'}
              href={'https://medium.com/celohq/call-for-proposals-the-celo-fellowship-3c43b06b10f9'}
            />
          </View>
        </Cell>
        <Cell span={Spans.half}>
          <View style={isMobile ? styles.maskedMobile : styles.maskedCircle}>
            <QuarterCircle />
          </View>
        </Cell>
      </GridRow>
    </View>
  )
}

export default withScreenSize(withNamespaces(NameSpaces.fellowship)(FellowCover))

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: colors.dark,
  },
  maskedCircle: {
    paddingTop: 0,
  },
  maskedMobile: {
    paddingTop: 0,
    transform: [{ translateX: 50 }],
  },
  keepOnScreen: {
    overflow: 'hidden',
    maxWidth: '100vw',
  },
  proposalArea: { flexDirection: 'column-reverse' },
  proposalText: { paddingBottom: '10%' },
  verticalCenter: { justifyContent: 'center' },
})

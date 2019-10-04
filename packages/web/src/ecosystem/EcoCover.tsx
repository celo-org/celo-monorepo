import { StyleSheet, View } from 'react-native'
import Sweep from 'src/community/connect/Sweep'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { colors, standardStyles, textStyles } from 'src/styles'

function EcoCover({ t }: I18nProps) {
  return (
    <View style={[styles.darkBackground, styles.keepOnScreen]}>
      <GridRow mobileStyle={styles.proposalArea}>
        <Cell span={Spans.half} style={styles.verticalCenter}>
          <View style={styles.proposalText}>
            <H2 style={[textStyles.invert, standardStyles.elementalMarginBottom]}>
              {t(`coverTitle`)}
            </H2>
            <Button
              kind={BTN.NAKED}
              size={SIZE.normal}
              text={t('coverBtn')}
              target={'_blank'}
              href={''}
            />
          </View>
        </Cell>
        <Cell span={Spans.half}>
          <View style={styles.maskedCircle}>
            <Sweep />
          </View>
        </Cell>
      </GridRow>
    </View>
  )
}
// TODO masked circle will need to change for tablet and mobile
export default withNamespaces(NameSpaces.ecosystem)(EcoCover)

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: colors.dark,
  },
  maskedCircle: {
    height: '60vh',
    width: 800,
  },
  keepOnScreen: {
    overflow: 'hidden',
    maxHeight: '50vh',
  },
  proposalArea: { flexDirection: 'column-reverse' },
  proposalText: {},
  verticalCenter: { justifyContent: 'center', maxHeight: '50vh' },
})

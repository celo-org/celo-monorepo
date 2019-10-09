import { StyleSheet, View } from 'react-native'
import Sweep from 'src/community/connect/Sweep'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { colors, standardStyles, textStyles } from 'src/styles'
import { withScreenSize, ScreenProps, ScreenSizes } from 'src/layout/ScreenSize'

function EcoCover({ t, screen }: I18nProps & ScreenProps) {
  const isMobile = screen === ScreenSizes.MOBILE
  return (
    <View
      style={[styles.darkBackground, isMobile ? styles.keepOnScreenMobile : styles.keepOnScreen]}
    >
      <GridRow mobileStyle={styles.proposalArea}>
        <Cell span={Spans.half} style={isMobile ? styles.textAreaMobile : styles.verticalCenter}>
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
          <View style={MASKED_CIRCLE[screen]}>
            <Sweep />
          </View>
        </Cell>
      </GridRow>
    </View>
  )
}

// TODO masked circle will need to change for tablet and mobile
export default withScreenSize(withNamespaces(NameSpaces.ecosystem)(EcoCover))

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: colors.dark,
  },
  maskedCircle: {
    height: '60vh',
    width: 800,
  },
  maskedCircleTablet: {
    height: '50vh',
    width: 600,
  },
  maskedCircleMobile: {
    height: '100vw',
    width: '100vw',
  },
  keepOnScreen: {
    overflow: 'hidden',
    height: '50vh',
  },
  keepOnScreenMobile: {
    overflow: 'hidden',
    height: '65vh',
  },
  proposalArea: { flexDirection: 'column', justifyContent: 'space-between' },
  proposalText: {},
  verticalCenter: { justifyContent: 'center', maxHeight: '50vh' },
  textAreaMobile: {
    height: 'fit-content',
    marginTop: 100,
  },
})

const MASKED_CIRCLE = {
  [ScreenSizes.MOBILE]: styles.maskedCircleMobile,
  [ScreenSizes.TABLET]: styles.maskedCircleTablet,
  [ScreenSizes.DESKTOP]: styles.maskedCircle,
}

import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import StakeOffRings from 'src/baklava/StakeOffRings'
import StakeOffCooking from 'src/baklava/StakeOffCooking'
import { H1, H2, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles } from 'src/styles'

const DELAY = 400
const DURATION = 400

const CoverComponent = React.memo(function Cover({ t }: I18nProps) {
  return (
    <View style={styles.cover}>
      <View style={styles.phone}>
        <StakeOffRings />
      </View>
      <GridRow
        allStyle={standardStyles.centered}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
      >
        <Cell span={Spans.three4th} style={[standardStyles.centered]}>
          <H1
            style={[
              textStyles.center,
              textStyles.invert,
              standardStyles.blockMarginTopTablet,
              standardStyles.elementalMarginBottom,
            ]}
          >
            {t('makeCoverTitle')}
          </H1>

          <H4 style={[textStyles.center, textStyles.invert, standardStyles.elementalMarginBottom]}>
            <Fade ssrReveal={true} delay={DELAY} duration={DURATION}>
              {t('makeCoverSubtitle')}
            </Fade>
          </H4>
        </Cell>
      </GridRow>
      <View style={styles.subcover}>
        <StakeOffCooking />
      </View>
      <GridRow
        allStyle={standardStyles.centered}
        desktopStyle={standardStyles.elementalMarginBottom}
        tabletStyle={standardStyles.elementalMarginBottom}
      >
        <Cell span={Spans.three4th} style={[standardStyles.centered]}>
          <H2
            style={[
              textStyles.center,
              textStyles.invert,
              standardStyles.blockMarginTopTablet,
              standardStyles.elementalMarginBottom,
            ]}
          >
            {t('stakeOffCoverTitle')}
          </H2>

          <H4 style={[textStyles.center, textStyles.invert, standardStyles.elementalMarginBottom]}>
            <Fade ssrReveal={true} delay={DELAY} duration={DURATION}>
              {t('stakeOffCoverSubtitle')}
            </Fade>
          </H4>
        </Cell>
      </GridRow>
    </View>
  )
})

const styles = StyleSheet.create({
  buttons: {
    flex: 1,
    maxWidth: '100vw',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cover: {
    marginTop: HEADER_HEIGHT,
    backgroundColor: colors.dark,
    maxWidth: '100vw',
    overflow: 'hidden',
  },
  subcover: {
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: colors.dark,
    maxWidth: '100vw',
    overflow: 'hidden',
  },
  phone: {
    height: '27vh',
    minHeight: 250,
    marginTop: HEADER_HEIGHT,
  },
  gap: {
    width: 20,
  },
  button: {
    marginHorizontal: 10,
  },
})

export default withNamespaces('baklava')(CoverComponent)

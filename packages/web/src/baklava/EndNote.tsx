import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { colors, standardStyles, textStyles } from 'src/styles'

const DELAY = 400
const DURATION = 400

const CoverComponent = React.memo(function Cover({ t }: I18nProps) {
  return (
    <View style={styles.cover}>
      <GridRow
        allStyle={standardStyles.centered}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
      >
        <Cell span={Spans.three4th} style={[standardStyles.centered]}>
          <H4
            style={[
              textStyles.center,
              textStyles.invert,
              standardStyles.blockMarginTopTablet,
              standardStyles.elementalMarginBottom,
            ]}
          >
            {t('aboutChallengeTitle')}
          </H4>

          <View
            style={[textStyles.center, textStyles.invert, standardStyles.elementalMarginBottom]}
          >
            <Fade ssrReveal={true} delay={DELAY} duration={DURATION}>
              {t('aboutChallengeText')}
            </Fade>
          </View>
        </Cell>
      </GridRow>
    </View>
  )
})

const styles = StyleSheet.create({
  cover: {
    marginTop: 0,
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
})

export default withNamespaces('baklava')(CoverComponent)

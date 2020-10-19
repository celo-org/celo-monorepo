import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import CoverActions from 'src/dev/CoverActions'
import Phone from 'src/dev/Phone'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Fade from 'src/shared/AwesomeFade'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles } from 'src/styles'

const DELAY = 400
const DELAY_2 = DELAY * 1.3
const DURATION = 400

const CoverComponent = React.memo(function Cover({ t }: I18nProps) {
  return (
    <View style={styles.cover}>
      <View style={styles.phone}>
        <Phone />
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
            {t('developerSDKTitle')}
          </H1>
          <H4 style={[textStyles.center, textStyles.invert]}>{t('developerSDKsubtitle')}</H4>
        </Cell>
      </GridRow>
      <Fade delay={DELAY_2} duration={DURATION} distance={'40px'}>
        <View>
          <CoverActions />
        </View>
      </Fade>
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

export default withNamespaces('dev')(CoverComponent)

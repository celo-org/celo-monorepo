import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Tetris from 'src/about/Tetris'
import FullCircle from 'src/community/connect/FullCircle'
import { H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { fonts, standardStyles } from 'src/styles'

function Values({ t, screen }: I18nProps & ScreenProps) {
  const isMobile = screen === ScreenSizes.MOBILE
  return (
    <>
      <GridRow desktopStyle={standardStyles.centered} tabletStyle={[styles.pullRight]}>
        <Cell span={Spans.half} tabletSpan={Spans.three4th}>
          <View
            style={[
              standardStyles.blockMarginBottomMobile,
              isMobile ? styles.tetrisMobile : styles.tetrisDesktop,
            ]}
          >
            <Tetris />
          </View>
          <H4>{t('value1Title')}</H4>
          <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('value1Text')}</Text>
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={[standardStyles.sectionMarginBottom, standardStyles.centered]}
        tabletStyle={[standardStyles.sectionMarginBottomTablet, styles.pullRight]}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Cell span={Spans.half} tabletSpan={Spans.three4th}>
          <View
            style={[
              standardStyles.blockMarginMobile,
              isMobile ? styles.circleMobile : styles.circleDesktop,
            ]}
          >
            <FullCircle lightBackground={true} stillMode={true} />
          </View>
          <H4>{t('value2Title')}</H4>
          <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('value2Text')}</Text>
        </Cell>
      </GridRow>
    </>
  )
}

const styles = StyleSheet.create({
  circleDesktop: { height: 400, padding: 20 },
  circleMobile: { height: 325, padding: 15 },
  tetrisDesktop: { height: 350, padding: 20 },
  tetrisMobile: { height: 250, padding: 15 },
  pullRight: { justifyContent: 'flex-end' },
})

export default React.memo(withScreenSize(withNamespaces('about')(Values)))

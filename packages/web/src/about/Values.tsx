import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Testris from 'src/about/Testris'
import FullCircle from 'src/community/connect/FullCircle'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { fonts, standardStyles } from 'src/styles'

function Values({ t, screen }: I18nProps & ScreenProps) {
  const isMobile = screen === ScreenSizes.MOBILE
  return (
    <>
      <GridRow
        desktopStyle={standardStyles.sectionMargin}
        tabletStyle={standardStyles.sectionMarginTablet}
        mobileStyle={standardStyles.sectionMarginMobile}
      >
        <Cell span={Spans.half}>
          <View style={isMobile ? styles.tetrisMobile : styles.tetrisDesktop}>
            <Testris />
          </View>
        </Cell>
        <Cell span={Spans.half} style={{ justifyContent: 'center' }}>
          <H2>{t('value1Title')}</H2>
          <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('value1Text')}</Text>
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Cell span={Spans.half}>
          <View style={isMobile ? styles.circleMobile : styles.circleDesktop}>
            <FullCircle lightBackground={true} />
          </View>
        </Cell>
        <Cell span={Spans.half} style={{ justifyContent: 'center' }}>
          <H2>{t('value2Title')}</H2>
          <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('value2Text')}</Text>
        </Cell>
      </GridRow>
    </>
  )
}

const styles = StyleSheet.create({
  circleDesktop: { height: 450, padding: 20 },
  circleMobile: { height: 325, padding: 15 },
  tetrisDesktop: { height: 325, padding: 20 },
  tetrisMobile: { height: 250, padding: 15 },
})

export default React.memo(withScreenSize(withNamespaces('about')(Values)))

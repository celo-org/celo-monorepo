import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import CoinListGlyph from 'src/home/logos/coinlist-glyph.png'
import CoinListLogo from 'src/home/logos/coinlist-logo.png'
import { NameSpaces, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import RingsGlyph from 'src/logos/RingsGlyph'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import EX from 'src/shared/EX'
import { CeloLinks } from 'src/shared/menu-items'
import { colors, fonts, standardStyles } from 'src/styles'

export default function CoinList() {
  const { t } = useTranslation(NameSpaces.home)
  const { isMobile } = useScreenSize()
  return (
    <GridRow
      mobileStyle={standardStyles.sectionMarginBottomMobile}
      tabletStyle={standardStyles.sectionMarginBottomTablet}
      desktopStyle={standardStyles.sectionMarginBottom}
    >
      <Cell span={Spans.half}>
        <Image
          accessibilityLabel="coinlist logo"
          source={CoinListLogo}
          style={isMobile ? styles.clLogoMobile : styles.clLogo}
          resizeMode="contain"
        />
      </Cell>
      <Cell span={Spans.half}>
        <View style={styles.logos}>
          <Image source={CoinListGlyph} style={styles.glyph} />
          <View style={styles.exes}>
            <EX size={20} color={colors.dark} strokeWidth={2} />
          </View>
          <RingsGlyph height={40} />
        </View>
        <H4 style={fonts.h4}>{t('coinlist.title')}</H4>
        <Text style={[fonts.p, styles.paragraph]}>{t('coinlist.text')}</Text>
        <Button
          kind={BTN.PRIMARY}
          href={CeloLinks.coinlist}
          target="_blank"
          text={t('coinlist.btn')}
          size={isMobile && SIZE.fullWidth}
        />
      </Cell>
    </GridRow>
  )
}

const styles = StyleSheet.create({
  clLogo: {
    maxWidth: '95%',
    marginTop: 60,
    alignSelf: 'center',
    width: 322,
    height: 55,
  },
  clLogoMobile: {
    marginBottom: 15,
    maxWidth: '100%',
    width: 345,
    height: 70,
  },
  glyph: {
    height: 40,
    width: 40,
  },
  logos: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  paragraph: {
    maxWidth: 450,
    marginTop: 10,
    marginBottom: 30,
  },
  exes: {
    marginVertical: 10,
    marginHorizontal: 20,
  },
})

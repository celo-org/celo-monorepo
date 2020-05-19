import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H2, H4 } from 'src/fonts/Fonts'
import { NameSpaces, useTranslation } from 'src/i18n'
import ExchangeCUSD from 'src/icons/ExchangeIconCUSD'
import ExchangeCGLD from 'src/icons/ExchangeIconCGLD'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import RingsGlyph from 'src/logos/RingsGlyph'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import menuItems from 'src/shared/menu-items'
import { fonts, standardStyles, textStyles } from 'src/styles'

const ICON_SIZE = 60

export function TwoAssets() {
  const { t } = useTranslation(NameSpaces.home)
  return (
    <View style={standardStyles.darkBackground}>
      <GridRow
        desktopStyle={standardStyles.blockMargin}
        tabletStyle={standardStyles.blockMarginTablet}
        mobileStyle={standardStyles.blockMarginMobile}
        allStyle={standardStyles.centered}
      >
        <Cell span={Spans.half} style={standardStyles.centered}>
          <RingsGlyph darkMode={true} height={40} />
          <H2
            style={[
              textStyles.invert,
              textStyles.center,
              standardStyles.elementalMargin,
              styles.title,
            ]}
          >
            {t('twoMoneyTitle')}
          </H2>
          <Button
            kind={BTN.NAKED}
            text={t('stabilityPaper')}
            href={menuItems.PAPERS.link}
            size={SIZE.normal}
          />
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <AssetToken ticker="cUSD" info={t('cUSDinfo')} icon={<ExchangeCUSD size={ICON_SIZE} />} />
        <AssetToken ticker="cGLD" info={t('cGLDinfo')} icon={<ExchangeCGLD size={ICON_SIZE} />} />
      </GridRow>
    </View>
  )
}

interface Props {
  ticker: string
  icon: React.ReactNode
  info: string
}

function AssetToken({ ticker, info, icon }: Props) {
  return (
    <Cell span={Spans.half} style={standardStyles.centered}>
      <View style={styles.root}>
        <View style={styles.image}>{icon}</View>
        <H4 style={textStyles.readingOnDark}>{ticker}</H4>
        <Text style={[fonts.p, textStyles.readingOnDark]}>{info}</Text>
      </View>
    </Cell>
  )
}

const styles = StyleSheet.create({
  root: {
    maxWidth: 330,
  },
  title: {
    maxWidth: 380,
  },
  image: {
    overflow: 'hidden',
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginBottom: 20,
    borderRadius: ICON_SIZE,
  },
})

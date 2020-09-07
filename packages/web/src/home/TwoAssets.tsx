import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H2, H4 } from 'src/fonts/Fonts'
import { NameSpaces, useTranslation } from 'src/i18n'
import ExchangeCELO from 'src/icons/ExchangeIconCELO'
import ExchangeCUSD from 'src/icons/ExchangeIconCUSD'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'
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
        desktopStyle={standardStyles.sectionMarginTop}
        tabletStyle={standardStyles.sectionMarginTopTablet}
        mobileStyle={standardStyles.sectionMarginTopMobile}
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
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.blockMarginBottom}
        tabletStyle={standardStyles.blockMarginBottomTablet}
        mobileStyle={standardStyles.blockMarginBottomMobile}
      >
        <AssetToken ticker="cUSD" info={t('cUSDinfo')} icon={<ExchangeCUSD size={ICON_SIZE} />}>
          <Button
            kind={BTN.NAKED}
            text={t('stabilityPaper')}
            href={menuItems.PAPERS.link}
            size={SIZE.normal}
          />
        </AssetToken>
        <AssetToken ticker="CELO" info={t('CELOinfo')} icon={<ExchangeCELO size={ICON_SIZE} />}>
          <Button
            kind={BTN.NAKED}
            text={t('viewReserve')}
            href={'https://celoreserve.org'}
            size={SIZE.normal}
          />
          <Button
            kind={BTN.NAKED}
            text={t('learnGovernance')}
            href={
              'https://medium.com/celoorg/celo-gold-holders-make-your-voice-heard-through-on-chain-governance-96cb5a1e8b90'
            }
            size={SIZE.normal}
          />
        </AssetToken>
      </GridRow>
    </View>
  )
}

interface Props {
  ticker: string
  icon: React.ReactNode
  info: string
  children?: React.ReactNode
}

function getMargin(screen) {
  switch (screen) {
    case ScreenSizes.DESKTOP:
      return standardStyles.blockMarginTop
    case ScreenSizes.TABLET:
      return standardStyles.blockMarginTopTablet
    default:
      return standardStyles.blockMarginTopMobile
  }
}

function AssetToken({ ticker, info, icon, children }: Props) {
  const { screen } = useScreenSize()
  const containerStyle = [getMargin(screen), styles.container]
  return (
    <Cell span={Spans.half} style={containerStyle}>
      <View style={styles.root}>
        <View>
          <View style={styles.image}>{icon}</View>
          <H4 style={textStyles.readingOnDark}>{ticker}</H4>
          <Text
            style={[
              fonts.p,
              textStyles.readingOnDark,
              standardStyles.halfElement,
              standardStyles.elementalMarginBottom,
            ]}
          >
            {info}
          </Text>
        </View>
        <View style={styles.governanceLinks}>{children}</View>
      </View>
    </Cell>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  governanceLinks: {
    minHeight: 50,
    justifyContent: 'space-between',
  },
  root: {
    maxWidth: 330,
    flex: 1,
    justifyContent: 'space-between',
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

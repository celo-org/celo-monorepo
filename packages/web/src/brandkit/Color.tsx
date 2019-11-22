import * as React from 'react'
import { withNamespaces } from 'react-i18next'
import { ImageBackground, ImageRequireSource, StyleSheet, Text, View } from 'react-native'
import Palette from 'src/brandkit/color/Palette'
import { brandStyles } from 'src/brandkit/common/constants'
import Page from 'src/brandkit/common/Page'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import SectionTitle from 'src/brandkit/common/SectionTitle'
import Judgement, { Value } from 'src/brandkit/logo/Judgement'
import { I18nProps, NameSpaces } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'
import { colors, fonts, standardStyles } from 'src/styles'
import { withScreenSize, ScreenProps, ScreenSizes } from 'src/layout/ScreenSize'

const { brandColor } = hashNav

export default React.memo(function Color() {
  return (
    <Page
      sections={[
        { id: brandColor.overview, children: <Overview /> },
        { id: brandColor.system, children: <Backgrounds /> },
      ]}
    />
  )
})

const PRIMARY_PALETTE = [
  { name: 'Celo Green', hex: colors.primary },
  { name: 'Celo Gold', hex: colors.gold },
  { name: 'Celo Dark', hex: colors.dark },
  { name: 'White', hex: colors.white },
]

const ACCENT_PALETTE = [
  { name: 'Violet', hex: colors.purple },
  { name: 'Red', hex: colors.red },
  { name: 'Cyan', hex: colors.lightBlue },
  { name: 'Blue', hex: colors.deepBlue },
]

const GRAY_PALETTE = [
  { name: 'Heavy Gray', hex: colors.grayHeavy },
  { name: 'Gray', hex: colors.gray },
  { name: 'Light Gray', hex: colors.lightGray },
  { name: 'Faint Gray', hex: colors.faintGray },
]

const BACKGROUND_PALETTE = [
  { name: 'Faint Gray', hex: colors.faintGray },
  { name: 'Faint Gold', hex: colors.faintGold },
  { name: 'White', hex: colors.white },
  { name: 'Dark', hex: colors.dark },
]

const Overview = withNamespaces(NameSpaces.brand)(function _Overview({ t }: I18nProps) {
  return (
    <View>
      <PageHeadline
        title={t('color.title')}
        headline={t('color.headline')}
        style={standardStyles.blockMarginBottom}
      />
      <Palette
        title={t('color.primaries')}
        text={t('color.primariesText')}
        colors={PRIMARY_PALETTE}
      />
      <Palette title={t('color.accents')} text={t('color.accentsText')} colors={ACCENT_PALETTE} />
      <Palette title={t('color.grays')} text={t('color.graysText')} colors={GRAY_PALETTE} />
    </View>
  )
})

const Backgrounds = withNamespaces(NameSpaces.brand)(
  withScreenSize<I18nProps>(function _Backgrounds({ t, screen }: I18nProps & ScreenProps) {
    const stylesForJudgemnt = screen === ScreenSizes.DESKTOP ? styles.column : [standardStyles.row]

    return (
      <View>
        <SectionTitle containerStyle={brandStyles.gap}>{t('color.backgroundTitle')}</SectionTitle>
        <Palette text={t('color.backgroundText')} colors={BACKGROUND_PALETTE} />
        <Text style={[brandStyles.gap, fonts.h5a, standardStyles.elementalMarginBottom]}>
          {t('color.contrastTitle')}
        </Text>
        <Text style={[brandStyles.gap, fonts.p]}>{t('color.contrastText')}</Text>
        <View style={[standardStyles.elementalMargin, standardStyles.row]}>
          <Lorem
            color={colors.dark}
            backgroundColor={colors.white}
            withGap={true}
            hasBorder={true}
          />
          <Lorem color={colors.white} backgroundColor={colors.dark} withGap={true} />
        </View>
        <Text style={[brandStyles.gap, fonts.p]}>{t('color.contrastText2')}</Text>
        <View style={screen === ScreenSizes.DESKTOP ? brandStyles.tiling : { width: '100%' }}>
          <View style={stylesForJudgemnt}>
            <Judgement is={Value.Bad}>
              <Lorem color={colors.gold} backgroundColor={colors.faintGold} />
            </Judgement>
            <Judgement is={Value.Good}>
              <Lorem color={colors.dark} backgroundColor={colors.faintGold} />
            </Judgement>
          </View>
          <View style={stylesForJudgemnt}>
            <Judgement is={Value.Bad}>
              <Lorem
                color={colors.white}
                backgroundColor={colors.gray}
                image={require('src/brandkit/images/lilah.jpg')}
              />
            </Judgement>
            <Judgement is={Value.Good}>
              <Lorem
                color={colors.white}
                backgroundColor={colors.dark}
                image={require('src/brandkit/images/lilahOverlay.jpg')}
              />
            </Judgement>
          </View>
          <View style={stylesForJudgemnt}>
            <Judgement is={Value.Bad}>
              <Lorem color={colors.primary} backgroundColor={colors.deepBlue} />
            </Judgement>
            <Judgement is={Value.Good}>
              <Lorem color={colors.white} backgroundColor={colors.deepBlue} />
            </Judgement>
          </View>
        </View>
      </View>
    )
  })
)

interface LoremProps {
  backgroundColor: colors
  color: colors
  withGap?: boolean
  hasBorder?: boolean
  image?: ImageRequireSource
}

function Lorem({ backgroundColor, color, withGap, hasBorder, image }: LoremProps) {
  const Component = image ? ImageBackground : View

  return (
    // @ts-ignore
    <Component
      source={image}
      style={[
        standardStyles.centered,
        styles.lorem,
        hasBorder && brandStyles.fullBorder,
        withGap && brandStyles.gap,
        { backgroundColor },
      ]}
    >
      <Text style={[fonts.p, { color }]}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ac dignissim purus.
      </Text>
    </Component>
  )
}

const styles = StyleSheet.create({
  container: { padding: 10 },
  lorem: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    minHeight: 150,
  },
  column: {
    flex: 1,
  },
})

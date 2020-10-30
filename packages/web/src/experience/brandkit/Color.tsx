import * as React from 'react'
import { ImageBackground, ImageRequireSource, StyleSheet, Text, View } from 'react-native'
import Palette from 'src/experience/brandkit/color/Palette'
import Page, { COLOR_PATH } from 'src/experience/brandkit/common/Page'
import Judgement, { Value } from 'src/experience/brandkit/logo/Judgement'
import { brandStyles } from 'src/experience/common/constants'
import {
  ACCENT_PALETTE,
  BACKGROUND_PALETTE,
  GRAY_PALETTE,
  PRIMARY_PALETTE,
} from 'src/experience/common/data'
import PageHeadline from 'src/experience/common/PageHeadline'
import SectionTitle from 'src/experience/common/SectionTitle'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { hashNav } from 'src/shared/menu-items'
import { colors, fonts, standardStyles } from 'src/styles'
const { brandColor } = hashNav

export default React.memo(
  withNamespaces(NameSpaces.brand)(function Color({ t }: I18nProps) {
    return (
      <Page
        title={t('color.title')}
        metaDescription={t('colo.headline')}
        path={COLOR_PATH}
        sections={[
          { id: brandColor.overview, children: <Overview /> },
          { id: brandColor.backgrounds, children: <Backgrounds /> },
        ]}
      />
    )
  })
)

const Overview = withNamespaces(NameSpaces.brand)(function _Overview({ t }: I18nProps) {
  return (
    <View>
      <PageHeadline title={t('color.title')} style={standardStyles.blockMarginBottom} />
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
        <Text style={[brandStyles.gap, fonts.h5, standardStyles.elementalMarginBottom]}>
          {t('color.contrast')}
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
                image={require('src/experience/brandkit/images/lilah.jpg')}
              />
            </Judgement>
            <Judgement is={Value.Good}>
              <Lorem
                color={colors.white}
                backgroundColor={colors.dark}
                image={require('src/experience/brandkit/images/lilahOverlay.jpg')}
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
    // @ts-ignore : component does not have call signature?
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
    minHeight: 200,
  },
  column: {
    flex: 1,
  },
})

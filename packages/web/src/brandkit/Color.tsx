import { Text, View, StyleSheet } from 'react-native'
import { withNamespaces } from 'react-i18next'
import * as React from 'react'
import { colors, standardStyles } from 'src/styles'
import { hashNav } from 'src/shared/menu-items'
import { H1, H2, H3, H4 } from 'src/fonts/Fonts'

const { brandColor } = hashNav

import Page from 'src/brandkit/common/Page'
import { NameSpaces, I18nProps } from 'src/i18n'
import Palette from 'src/brandkit/color/Palette'
import { brandStyles } from 'src/brandkit/common/constants'

export default React.memo(function Color() {
  return (
    <Page
      sections={[
        {
          id: brandColor.overview,
          children: <Overview />,
        },
        {
          id: brandColor.system,
          children: (
            <View style={[styles.container, { minHeight: 400, backgroundColor: colors.primary }]}>
              <Text>{brandColor.system}</Text>
            </View>
          ),
        },
      ]}
    />
  )
})

// const PALET = Object.keys(colors)
//   .map((name) => ({
//     name,
//     hex: colors[name],
//     cmyk: 'todo',
//   }))
//   .filter((info) => info.hex.startsWith('#'))

const PRIMARY_PALETTE = [
  { name: 'Green', hex: colors.primary, cmyk: '???' },
  { name: 'Gold', hex: colors.gold, cmyk: '??' },
  { name: 'Dark', hex: colors.dark, cmyk: '??' },
  { name: 'White', hex: colors.white, cmyk: '??' },
]

const Overview = withNamespaces(NameSpaces.brand)(function _Overview({ t }: I18nProps) {
  return (
    <View>
      <View style={[brandStyles.gap, standardStyles.blockMarginBottom]}>
        <H1>{t('color.title')}</H1>
        <H4>{t('color.headline')}</H4>
      </View>
      <Palette
        title={t('color.primaries')}
        text={t('color.primariesText')}
        colors={PRIMARY_PALETTE}
      />
      <Palette title={t('color.accents')} text={t('color.accentsText')} colors={PRIMARY_PALETTE} />
      <Palette title={t('color.grays')} text={t('color.graysText')} colors={PRIMARY_PALETTE} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: { padding: 10 },
})

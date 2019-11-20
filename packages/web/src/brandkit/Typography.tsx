import * as React from 'react'
import { withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Page from 'src/brandkit/common/Page'
import { hashNav } from 'src/shared/menu-items'
import { standardStyles, fonts, typeFaces } from 'src/styles'
import { NameSpaces, I18nProps } from 'src/i18n'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import Button, { BTN } from 'src/shared/Button.3'
import { brandStyles } from 'src/brandkit/common/constants'
import { H2, H3 } from 'src/fonts/Fonts'
import SectionTitle from 'src/brandkit/common/SectionTitle'

const { brandTypography } = hashNav

export default React.memo(function Typography() {
  return (
    <Page
      sections={[
        { id: brandTypography.overview, children: <Overview /> },
        { id: brandTypography.system, children: <TypeScale /> },
      ]}
    />
  )
})

const Overview = withNamespaces(NameSpaces.brand)(
  React.memo(function _Overview({ t }: I18nProps) {
    return (
      <View>
        <PageHeadline
          title={t('typography.title')}
          headline={t('typography.headline')}
          style={standardStyles.elementalMarginBottom}
        />
        <View style={[brandStyles.gap, standardStyles.blockMarginBottom]}>
          <Button kind={BTN.PRIMARY} text={t('typograpphy.downloadAllBTN')} />
        </View>
        <View style={brandStyles.gap}>
          <H2>{t('typography.mainFontTitle')}</H2>
          <Text style={fonts.p}>{t('typography.mainFontText')}</Text>
          <Button
            kind={BTN.TERTIARY}
            text={t('typograpphy.getMainfontBTN')}
            style={brandStyles.button}
          />
          <View style={standardStyles.blockMargin}>
            <H3>{t('typography.subFontTitle')}</H3>
            <Text style={[fonts.p, { fontFamily: typeFaces.futura }]}>
              {t('typography.subFontText')}
            </Text>
            <Button
              kind={BTN.TERTIARY}
              text={t('typograpphy.getSubfontBTN')}
              style={brandStyles.button}
            />
          </View>
        </View>
      </View>
    )
  })
)

const TYPEFACES = [
  { font: fonts.h1, name: 'Heading One' },
  { font: fonts.h2, name: 'Heading Two' },
  { font: fonts.h3, name: 'Heading Three' },
  { font: fonts.h4, name: 'Heading Four' },
  { font: fonts.h5, name: 'Heading Five' },
  { font: fonts.h5, name: 'Heading Six' },
  { font: fonts.p, name: 'Body' },
  { font: fonts.mini, name: 'Small' },
]

const TypeScale = withNamespaces(NameSpaces.brand)(
  React.memo(function _TypeScale({ t }: I18nProps) {
    return (
      <View>
        <SectionTitle containerStyle={brandStyles.gap}>
          {t('typography.typescaleTitle')}
        </SectionTitle>
        <Text style={[fonts.p, brandStyles.gap]}>{t('typography.typescaleText')}</Text>
        <View
          style={[
            standardStyles.elementalMargin,
            brandStyles.gap,
            brandStyles.fullBorder,
            styles.box,
          ]}
        >
          {TYPEFACES.map((typeface) => {
            return (
              <View key={typeface.name} style={standardStyles.row}>
                <Text style={typeface.font}>{typeface.name} </Text>
                <Text>{typeface.font.fontFamily}</Text>
              </View>
            )
          })}
        </View>
      </View>
    )
  })
)

const styles = StyleSheet.create({
  box: {
    padding: 30,
    flex: 1,
  },
})

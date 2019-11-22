import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import Page from 'src/brandkit/common/Page'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import SectionTitle from 'src/brandkit/common/SectionTitle'
import UseageExamples from 'src/brandkit/typography/UseageExample'
import { H2, H3 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN } from 'src/shared/Button.3'
import { hashNav } from 'src/shared/menu-items'
import { fontInfo, fonts, standardStyles, typeFaces } from 'src/styles'

const { brandTypography } = hashNav

export default React.memo(function Typography() {
  return (
    <Page
      sections={[
        { id: brandTypography.overview, children: <Overview /> },
        { id: brandTypography.system, children: <TypeScale /> },
        { id: brandTypography.guideline, children: <UseageExamples /> },
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
          <Button kind={BTN.PRIMARY} text={t('typography.downloadAllBTN')} />
        </View>
        <View style={brandStyles.gap}>
          <H2>{t('typography.mainFontTitle')}</H2>
          <Text style={fonts.p}>{t('typography.mainFontText')}</Text>
          <Button
            kind={BTN.TERTIARY}
            text={t('typography.getMainfontBTN')}
            style={brandStyles.button}
          />
          <View style={standardStyles.blockMargin}>
            <H3>{t('typography.subFontTitle')}</H3>
            <Text style={[fonts.p, { fontFamily: typeFaces.futura }]}>
              {t('typography.subFontText')}
            </Text>
            <Button
              kind={BTN.TERTIARY}
              text={t('typography.getSubfontBTN')}
              style={brandStyles.button}
            />
          </View>
        </View>
      </View>
    )
  })
)

const TYPEFACES = [
  { font: fonts.h1, name: 'Heading One', data: fontInfo.h1 },
  { font: fonts.h2, name: 'Heading Two', data: fontInfo.h2 },
  { font: fonts.h3, name: 'Heading Three', data: fontInfo.h3 },
  { font: fonts.h4, name: 'Heading Four', data: fontInfo.h4 },
  { font: fonts.h5a, name: 'Heading Five', data: fontInfo.h5a },
  { font: fonts.h6, name: 'Heading Six', data: fontInfo.h6 },
  { font: fonts.p, name: 'Body', data: fontInfo.p },
  { font: fonts.legal, name: 'Small', data: fontInfo.legal },
]

const TypeScale = withNamespaces(NameSpaces.brand)(
  React.memo(
    withScreenSize<I18nProps>(function _TypeScale({ t, screen }: I18nProps & ScreenProps) {
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
                <View
                  key={typeface.name}
                  style={[
                    screen !== ScreenSizes.MOBILE && standardStyles.row,
                    brandStyles.bottomBorder,
                    screen === ScreenSizes.MOBILE ? styles.fontInfoMobile : styles.fontInfo,
                  ]}
                >
                  <View style={styles.fontNameBox}>
                    <Text style={typeface.font}>{typeface.name} </Text>
                  </View>
                  <View
                    style={[
                      standardStyles.row,
                      screen === ScreenSizes.MOBILE ? styles.stylesAreaMobile : styles.stylesArea,
                    ]}
                  >
                    <Text style={fonts.h6}>
                      {typeface.data.fontFamily.split(',')[0]} •{' '}
                      {getWeight(typeface.data.fontWeight)}
                    </Text>
                    <View>
                      <Text style={fonts.h6}>
                        {typeface.data.fontSize}px / {typeface.data.lineHeight}px
                      </Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      )
    })
  )
)

function getWeight(number) {
  switch (number) {
    case '500':
      return 'Medium'
    case '300':
      return 'Book'
    case undefined:
      return 'Regular'
    default:
      return number
  }
}

const styles = StyleSheet.create({
  box: {
    padding: 30,
    flex: 1,
  },
  fontInfo: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    alignContent: 'flex-end',
    paddingBottom: 15,
    paddingTop: 30,
    flexWrap: 'wrap',
  },
  fontNameBox: { flex: 1, minWidth: 280 },
  fontInfoMobile: {
    paddingBottom: 15,
    paddingTop: 30,
  },
  stylesArea: { flex: 1, minWidth: 250, justifyContent: 'space-between', marginTop: 5 },
  stylesAreaMobile: { flex: 1, marginTop: 5 },
})

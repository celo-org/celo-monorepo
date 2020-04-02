import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import DownloadButton from 'src/brandkit/common/DownloadButton'
import Page, { TYPE_PATH } from 'src/brandkit/common/Page'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import SectionTitle from 'src/brandkit/common/SectionTitle'
import { GARMOND_TRACKING, JOST_TRACKING } from 'src/brandkit/tracking'
import UseageExamples from 'src/brandkit/typography/UseageExample'
import { H2, H3 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import InlineAnchor from 'src/shared/InlineAnchor'
import { hashNav } from 'src/shared/menu-items'
import { fontInfo, fonts, standardStyles } from 'src/styles'
const { brandTypography } = hashNav

function getWeight(weight: string | undefined) {
  switch (weight) {
    case '500':
      return 'Medium'
    case '400':
      return 'Book'
    case undefined:
      return 'Regular'
    default:
      return weight
  }
}

export default React.memo(
  withNamespaces(NameSpaces.brand)(function Typography({ t }: I18nProps) {
    return (
      <Page
        title={t('typography.title')}
        metaDescription={t('typography.headline')}
        path={TYPE_PATH}
        sections={[
          { id: brandTypography.overview, children: <Overview /> },
          { id: brandTypography.scale, children: <TypeScale /> },
        ]}
      />
    )
  })
)

const Overview = withNamespaces(NameSpaces.brand)(
  React.memo(function _Overview({ t }: I18nProps) {
    return (
      <View>
        <PageHeadline
          title={t('typography.title')}
          headline={t('typography.headline')}
          style={standardStyles.blockMarginBottom}
        />
        <View style={brandStyles.gap}>
          <Text style={fonts.h5}>{t('typography.facesTitle')}</Text>
          <Text style={[fonts.p, standardStyles.elementalMargin]}>
            <Trans ns={NameSpaces.brand} i18nKey={'typography.facesText'}>
              <InlineAnchor href="https://medium.com/celoOrg/the-why-of-the-celo-coin-part-1-of-3-5e5701805847">
                philosophy
              </InlineAnchor>
            </Trans>
          </Text>
          <H2 style={styles.hero}>{t('typography.mainFontTitle')}</H2>
          <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
            {t('typography.mainFontText')}
          </Text>
          <DownloadButton
            uri="https://fonts.google.com/specimen/EB+Garamond"
            trackingData={GARMOND_TRACKING}
          />
          <View style={standardStyles.blockMarginTopTablet}>
            <H3 style={styles.hero}>{t('typography.subFontTitle')}</H3>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
              {t('typography.subFontText')}
            </Text>
            <DownloadButton
              uri="https://indestructibletype.com/Jost.html"
              trackingData={JOST_TRACKING}
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
  { font: fonts.h5, name: 'Heading Five', data: fontInfo.h5 },
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
              standardStyles.elementalMarginTop,
              standardStyles.blockMarginBottom,
              brandStyles.gap,
              brandStyles.fullBorder,
              screen === ScreenSizes.MOBILE ? styles.mobileBox : styles.box,
            ]}
          >
            {TYPEFACES.map((typeface, index) => {
              return (
                <View
                  key={typeface.name}
                  style={[
                    screen !== ScreenSizes.MOBILE && standardStyles.row,
                    index !== TYPEFACES.length - 1 && brandStyles.bottomBorder,
                    screen === ScreenSizes.MOBILE ? styles.fontInfoMobile : styles.fontInfo,
                  ]}
                >
                  <View style={styles.fontNameBox}>
                    <Text style={typeface.font}>{typeface.name}</Text>
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
          <UseageExamples />
        </View>
      )
    })
  )
)

const styles = StyleSheet.create({
  box: {
    padding: 30,
    flex: 1,
  },
  mobileBox: {
    padding: 10,
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
  hero: {
    margin: 30,
  },
})

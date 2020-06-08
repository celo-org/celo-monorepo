import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Page, { COMPOSITION_PATH } from 'src/experience/brandkit/common/Page'
import exampleImage from 'src/experience/brandkit/images/aroundPhone.png'
import { brandStyles } from 'src/experience/common/constants'
import PageHeadline from 'src/experience/common/PageHeadline'
import { H2, H4 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

export default React.memo(
  withNamespaces(NameSpaces.brand)(function Intro({ t }: I18nProps) {
    return (
      <>
        <Page
          title="Composition"
          path={COMPOSITION_PATH}
          metaDescription={t('composition.introduction')}
          sections={[
            { id: hashNav.brandComposition.overview, children: <Overview /> },
            { id: hashNav.brandComposition.grid, children: <GridArea /> },
          ]}
        />
      </>
    )
  })
)

const imageGridArea = { gridArea: 'image' } as any

const Overview = withNamespaces(NameSpaces.brand)(function _Overview({ t }: I18nProps) {
  return (
    <>
      <PageHeadline
        title={t('composition.title')}
        headline={t('composition.headline')}
        style={standardStyles.blockMarginBottom}
      />
      <View style={brandStyles.gap}>
        <Text style={[fonts.h5, standardStyles.elementalMarginBottom]}>
          {t('composition.alignmentTitle')}
        </Text>
        <Text style={fonts.p}>{t('composition.alignmentText')}</Text>
        <View
          style={[
            styles.alignments,
            standardStyles.blockMarginTopTablet,
            standardStyles.sectionMarginBottomTablet,
          ]}
        >
          <View style={styles.alignmentExample}>
            <H4 style={standardStyles.elementalMarginBottom}>
              {t('composition.alignmentExampleTitle')}
            </H4>
            <Image source={exampleImage} style={styles.graphicBig} />
            <Text style={[fonts.micro, styles.subtitle, standardStyles.elementalMarginTop]}>
              {t('composition.alignmentExampleSubtitle')}
            </Text>
            <Text style={fonts.legal}>{t('composition.alignmentExampleText')}</Text>
          </View>
          <View style={[styles.alignmentExample, styles.alignment2]}>
            <AlignmentExampleTitle t={t} />
            <Image source={exampleImage} style={styles.graphicBig} />
            <Text
              style={[
                fonts.micro,
                textStyles.center,
                styles.subtitle,
                standardStyles.elementalMarginTop,
              ]}
            >
              {t('composition.alignmentExampleSubtitle')}
            </Text>
            <Text style={[fonts.legal, textStyles.center]}>
              {t('composition.alignmentExampleText')}
            </Text>
          </View>
          <View style={styles.alignmentExample}>
            <AlignmentExampleTitle t={t} />
            <View style={[standardStyles.row, standardStyles.elementalMarginTop]}>
              <Image source={exampleImage} style={styles.graphicTiny} />
              <View style={styles.alignment3row}>
                <Text style={[fonts.micro, styles.subtitle]}>
                  {t('composition.alignmentExampleSubtitle')}
                </Text>
                <Text style={fonts.legal}>{t('composition.alignmentExampleText')}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.alignmentExample]}>
            <AlignmentExampleTitle t={t} />
            <View style={styles.fourthAlignment}>
              <Text style={[fonts.micro, styles.subtitle, { gridArea: 'subtitle' }]}>
                {t('composition.alignmentExampleSubtitle')}
              </Text>
              <Image source={exampleImage} style={[styles.graphicSmall, imageGridArea]} />
              <Text style={[fonts.legal, { gridArea: 'text' }]}>
                {t('composition.alignmentExampleText')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  )
})

const GridArea = withNamespaces(NameSpaces.brand)(function _Grid({ t }: I18nProps) {
  return (
    <View style={brandStyles.gap}>
      <H2 style={standardStyles.elementalMarginBottom}>{t('composition.gridTitle')}</H2>
      <Text style={fonts.p}>{t('composition.gridText')}</Text>
      <View style={[styles.gridExamplesContainer, standardStyles.blockMarginTopTablet]}>
        <GridExamples size={'⅟₁'} row={'1'} colStart="1" colEnd={'12'} />
        <GridExamples size={'½'} row={'2'} colStart="1" colEnd={'6'} />
        <GridExamples size={'½'} row={'2'} colStart="6" colEnd={'12'} />
        <GridExamples size={'⅓'} row={'3'} colStart="1" colEnd={'4'} />
        <GridExamples size={'⅓'} row={'3'} colStart="4" colEnd={'8'} />
        <GridExamples size={'⅓'} row={'3'} colStart="8" colEnd={'12'} />
        <GridExamples size={'¼'} row={'4'} colStart="1" colEnd={'3'} />
        <GridExamples size={'¼'} row={'4'} colStart="3" colEnd={'6'} />
        <GridExamples size={'¼'} row={'4'} colStart="6" colEnd={'9'} />
        <GridExamples size={'¼'} row={'4'} colStart="9" colEnd={'12'} />
      </View>
    </View>
  )
})

function GridExamples({ size, colStart, colEnd, row }) {
  return (
    <View style={[styles.gridExample, { gridArea: `${row} / ${colStart} / ${row} / ${colEnd} ` }]}>
      <Text style={[fonts.a, styles.gridExampleWithin]}>{size}</Text>
    </View>
  )
}

function AlignmentExampleTitle({ t }) {
  return (
    <H4 style={[standardStyles.elementalMarginBottom, textStyles.center]}>
      {t('composition.alignmentExampleTitle')}
    </H4>
  )
}

const styles = StyleSheet.create({
  gridExamplesContainer: {
    display: 'grid',
    gridColumns: 12,
    gridColumnGap: 15,
    gridRowGap: 15,
  },
  gridExample: {
    backgroundColor: colors.faintPurple,
    padding: 15,
    flex: 1,
  },
  gridExampleWithin: {
    borderColor: colors.purple,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    color: colors.purpleScreen,
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: -8,
  },
  alignments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    display: 'grid',
    gridRowGap: 15,
    gridColumnGap: 20,
    gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
  },
  alignmentExample: {
    borderWidth: 1,
    borderColor: colors.gray,
    paddingVertical: 30,
    paddingHorizontal: 20,
    maxWidth: 400,
  },
  alignment2: { alignItems: 'center' },
  alignment3row: { flex: 1, paddingLeft: 10 },
  fourthAlignment: {
    marginTop: 5,
    display: 'grid',
    gridTemplateColumns: `repeat(3, 1fr)`,
    gridTemplateRows: 'repeat(2, 1fr)',
    gridTemplateAreas: `". image image" "subtitle text text"`,
    gridColumnGap: 10,
  },
  subtitle: {
    marginBottom: 5,
    fontSize: 18,
  },
  graphicBig: { width: 139, height: 88 },
  graphicSmall: { width: 98, height: 63 },
  graphicTiny: { width: 83, height: 52 },
})

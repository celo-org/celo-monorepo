import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import CCLicense from 'src/brandkit/common/CCLicense'
import { brandStyles } from 'src/brandkit/common/constants'
import Fetch from 'src/brandkit/common/Fetch'
import Page, { IMAGERY_PATH } from 'src/brandkit/common/Page'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import Showcase from 'src/brandkit/common/Showcase'
import { AssetTypes } from 'src/brandkit/tracking'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'
import { hashNav } from 'src/shared/menu-items'
import Spinner from 'src/shared/Spinner'
import { colors, fonts, standardStyles } from 'src/styles'

const { brandImagery } = hashNav

const KeyImageryWrapped = withNamespaces(NameSpaces.brand)(
  React.memo(function KeyImagery({ t }: I18nProps) {
    return (
      <Page
        title={t('keyImagery.title')}
        metaDescription={t('keyImagery.headline')}
        path={IMAGERY_PATH}
        sections={[
          {
            id: brandImagery.overview,
            children: <Overview />,
          },
          {
            id: brandImagery.illustrations,
            children: <Illustrations />,
          },
          { id: brandImagery.graphics, children: <AbstractGraphics /> },
        ]}
      />
    )
  })
)

export default KeyImageryWrapped

const Overview = React.memo(
  withNamespaces(NameSpaces.brand)(function _Overview({ t }: I18nProps) {
    return (
      <View>
        <PageHeadline title={t('keyImagery.title')} headline={t('keyImagery.headline')} />
        <CCLicense textI18nKey="keyImagery.license" />
      </View>
    )
  })
)

function useIlloSize() {
  const { screen } = useScreenSize()
  switch (screen) {
    case ScreenSizes.DESKTOP:
      return 340
    case ScreenSizes.MOBILE:
      return 345
    case ScreenSizes.TABLET:
      return 222
  }
}

const Illustrations = React.memo(
  withNamespaces(NameSpaces.brand)(function _Illustrations({ t }: I18nProps) {
    const size = useIlloSize()
    return (
      <View style={standardStyles.blockMarginTopTablet}>
        <H2 style={[brandStyles.gap, standardStyles.elementalMarginBottom]}>
          {t('keyImagery.illoTitle')}
        </H2>
        <Text style={[brandStyles.gap, fonts.p]}>{t('keyImagery.illoText')}</Text>
        <Fetch query="/api/experience/assets/illustrations">
          {({ loading, data, error }) => {
            if (loading) {
              return <Loading />
            }

            if (error || data.length === 0) {
              return <SomethingsWrong />
            }

            return (
              <View style={[brandStyles.tiling, styles.illustrationsArea]}>
                {data.map((illo) => (
                  <Showcase
                    ratio={1.3}
                    assetType={AssetTypes.illustration}
                    key={illo.name}
                    description={illo.description}
                    name={illo.name}
                    preview={illo.preview}
                    uri={illo.uri}
                    loading={false}
                    size={size}
                  />
                ))}
              </View>
            )
          }}
        </Fetch>
      </View>
    )
  })
)

const AbstractGraphics = React.memo(
  withNamespaces(NameSpaces.brand)(function _AbstractGraphics({ t }: I18nProps) {
    return (
      <View style={standardStyles.sectionMarginTop}>
        <H2 style={[brandStyles.gap, standardStyles.elementalMarginBottom]}>
          {t('keyImagery.abstractTitle')}
        </H2>
        <Text style={[brandStyles.gap, fonts.p]}>{t('keyImagery.abstractText')}</Text>
        <Fetch query="/api/experience/assets/abstract-graphics">
          {({ loading, data, error }) => {
            if (loading) {
              return <Loading />
            }

            if (error || data.length === 0) {
              return <SomethingsWrong />
            }

            return (
              <View style={brandStyles.tiling}>
                {data.map((illo) => (
                  <Showcase
                    ratio={344 / 172}
                    assetType={AssetTypes.graphic}
                    key={illo.name}
                    description={illo.description}
                    name={illo.name}
                    preview={illo.preview}
                    uri={illo.uri}
                    loading={false}
                    size={'100%'}
                  />
                ))}
              </View>
            )
          }}
        </Fetch>
      </View>
    )
  })
)

function Loading() {
  return (
    <View style={[standardStyles.centered, styles.fillSpace]}>
      <Spinner color={colors.primary} size="medium" />
    </View>
  )
}

const SomethingsWrong = withNamespaces(NameSpaces.brand)(function _SomethingsWrong({ t }) {
  return (
    <View style={[standardStyles.centered, styles.fillSpace]}>
      <Text style={fonts.mini}>{t('keyImagery.errorMessage')}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  fillSpace: {
    minHeight: '60vh',
  },
  illustrationsArea: {
    justifyContent: 'space-between',
  },
})

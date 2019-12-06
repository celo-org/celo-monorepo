import * as React from 'react'
import { withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import { brandStyles, GAP } from 'src/brandkit/common/constants'
import Page from 'src/brandkit/common/Page'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import { I18nProps, NameSpaces, Trans } from 'src/i18n'

import Fetch from 'src/brandkit/common/Fetch'
import IconShowcase from 'src/brandkit/common/Showcase'
import InlineAnchor from 'src/shared/InlineAnchor'
import { CeloLinks, hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles } from 'src/styles'

export default React.memo(function IconsPage() {
  return (
    <Page
      sections={[
        {
          id: hashNav.brandIcons.overview,
          children: <Overview />,
        },
      ]}
    />
  )
})

interface IconData {
  description: string
  name: string
  preview: string
  uri: string
}

const LOADING = new Array(12)

const Overview = withNamespaces(NameSpaces.brand)(function _Overview({ t }: I18nProps) {
  return (
    <View style={styles.container}>
      <PageHeadline title={t('icons.title')} headline={t('icons.headline')} />
      <Text style={[fonts.h5a, brandStyles.gap, standardStyles.blockMarginTop]}>
        {t('licenseTitle')}
      </Text>
      <Text style={[fonts.p, brandStyles.gap, standardStyles.elementalMargin]}>
        <Trans i18nKey="icons.license">
          <InlineAnchor href={CeloLinks.iconsLicense}>
            Creative Commons Attribution-NoDerivatives 4.0 International License
          </InlineAnchor>
        </Trans>
      </Text>
      <View style={brandStyles.tiling}>
        <Fetch query="/brand/api/assets/icons">
          {({ loading, data }: { loading: boolean; data: IconData[] }) => {
            if (loading) {
              return LOADING.map((_, i) => {
                return (
                  <IconShowcase
                    size={160}
                    key={i}
                    loading={true}
                    name={'Celo Icon'}
                    uri={'#'}
                    description="..."
                  />
                )
              })
            }

            return data.map((icon) => (
              <IconShowcase
                key={icon.name}
                description={icon.description}
                name={icon.name}
                preview={{ uri: icon.preview }}
                uri={icon.uri}
                loading={false}
                size={160}
              />
            ))
          }}
        </Fetch>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { paddingHorizontal: GAP },
})

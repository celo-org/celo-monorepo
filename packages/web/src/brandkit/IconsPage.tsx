import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import CCLicense from 'src/brandkit/common/CCLicense'
import { brandStyles, GAP } from 'src/brandkit/common/constants'
import Fetch from 'src/brandkit/common/Fetch'
import Page, { ICONS_PATH } from 'src/brandkit/common/Page'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import IconShowcase from 'src/brandkit/common/Showcase'
import { AssetTypes } from 'src/brandkit/tracking'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'

export default React.memo(
  withNamespaces(NameSpaces.brand)(function IconsPage({ t }: I18nProps) {
    return (
      <Page
        title={t('icons.title')}
        metaDescription={t('icons.headline')}
        path={ICONS_PATH}
        sections={[{ id: hashNav.brandIcons.overview, children: <Overview /> }]}
      />
    )
  })
)

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
      <CCLicense textI18nKey="icons.license" />
      <View style={brandStyles.tiling}>
        <Fetch query="/api/experience/assets/icons">
          {({ loading, data }: { loading: boolean; data: IconData[] }) => {
            if (loading) {
              return LOADING.map((_, i) => {
                return (
                  <IconShowcase
                    size={160}
                    ratio={1}
                    key={i}
                    assetType={AssetTypes.icon}
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
                ratio={1}
                description={icon.description}
                name={icon.name}
                preview={{ uri: icon.preview }}
                uri={icon.uri}
                loading={false}
                assetType={AssetTypes.icon}
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

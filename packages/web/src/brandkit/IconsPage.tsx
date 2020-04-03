import fetch from 'cross-fetch'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import CCLicense from 'src/brandkit/common/CCLicense'
import { brandStyles, GAP } from 'src/brandkit/common/constants'
import Page, { ICONS_PATH } from 'src/brandkit/common/Page'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import IconShowcase from 'src/brandkit/common/Showcase'
import Search, { useSearch } from 'src/brandkit/Search'
import { AssetTypes } from 'src/brandkit/tracking'
import { I18nProps, NameSpaces, withNamespaces, useTranslation } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'
import FuzzySearch from 'fuzzy-search'

interface Icons {
  icons: IconData[]
}

const IconPage = React.memo(
  withNamespaces(NameSpaces.brand)(function IconsPage({ t, icons }: I18nProps & Icons) {
    return (
      <Page
        title={t('icons.title')}
        metaDescription={t('icons.headline')}
        path={ICONS_PATH}
        sections={[{ id: hashNav.brandIcons.overview, children: <Overview icons={icons} /> }]}
      />
    )
  })
)

// @ts-ignore
IconPage.getInitialProps = async ({ req }) => {
  let icons = []
  if (req) {
    const AssetBase = await import('src/../server/AssetBase')
    icons = await AssetBase.default(AssetBase.AssetSheet.Icons)
  } else {
    icons = await fetch('/api/experience/assets/icons').then((result) => result.json())
  }

  return { icons }
}

export default IconPage

interface IconData {
  description: string
  name: string
  preview: string
  uri: string
}

function Overview({ icons }: Icons) {
  const { t } = useTranslation(NameSpaces.brand)
  const { query, onQueryChange } = useSearch()
  const searcher = new FuzzySearch(icons, ['name'])
  const result = searcher.search(query)
  return (
    <View style={styles.container}>
      <PageHeadline title={t('icons.title')} headline={t('icons.headline')} />
      <CCLicense textI18nKey="icons.license" />
      <Search value={query} onChange={onQueryChange} />
      <View style={brandStyles.tiling}>
        {result.map((icon) => (
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
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: GAP },
})

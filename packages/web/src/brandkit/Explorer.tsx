import { debounce } from 'debounce'
import FuzzySearch from 'fuzzy-search'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import IconShowcase from 'src/brandkit/common/Showcase'
import Search, { useSearch } from 'src/brandkit/Search'
import { AssetTypes } from 'src/brandkit/tracking'
import { NameSpaces, useTranslation } from 'src/i18n'
import { fonts } from 'src/styles'
import { IconData, Icons } from './IconsPage'

function useFilteredResult(query: string, initial) {
  const [result, setResult] = React.useState(initial)

  React.useEffect(
    debounce(() => {
      setResult(search(query, initial))
    }, 50),
    [initial, query]
  )

  return result
}

export function Explorer({ icons }: Icons) {
  const { query, onQueryChange } = useSearch()
  const { t } = useTranslation(NameSpaces.brand)
  const results = useFilteredResult(query, icons).map((result) => result.id)
  const visibleIcons = new Set(results)
  return (
    <View style={{ minHeight: '100vh' }}>
      <Search value={query} onChange={onQueryChange} />
      {query ? (
        <Text style={[fonts.micro, brandStyles.gap]}>
          {t('icons.matching', { count: results.length })}
        </Text>
      ) : null}
      <View style={brandStyles.tiling}>
        {icons.map((icon) => (
          <View key={icon.id} style={!visibleIcons.has(icon.id) && styles.offScreen}>
            <IconShowcase
              key={icon.name}
              ratio={1}
              description={icon.description}
              name={icon.name}
              preview={icon.preview}
              uri={icon.uri}
              loading={false}
              assetType={AssetTypes.icon}
              size={160}
            />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  offScreen: {
    display: 'none',
  },
})

const fields = ['name', 'description', 'tags']

function search(query: string, icons: IconData[]) {
  const searcher = new FuzzySearch(icons, fields)
  const result = searcher.search(query)
  return result
}

import { debounce } from 'debounce'
import FuzzySearch from 'fuzzy-search'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import IconShowcase from 'src/brandkit/common/Showcase'
import Search, { useSearch } from 'src/brandkit/Search'
import { AssetTypes } from 'src/brandkit/tracking'
import { NameSpaces, useTranslation } from 'src/i18n'
import { colors, fonts } from 'src/styles'
import { IconData, Props } from './IconsPage'

export function Explorer({ icons }: Props) {
  const { t } = useTranslation(NameSpaces.brand)
  const { query, onQueryChange } = useSearch()
  const visibleIcons = useVisibleIconIDs(query, icons)
  return (
    <View style={styles.root}>
      <Search value={query} onChange={onQueryChange} />
      <Text style={[fonts.h6, brandStyles.gap, styles.matches, query && styles.visible]}>
        {visibleIcons.size === 0
          ? t('icons.matching_0')
          : t('icons.matching', { count: visibleIcons.size })}
      </Text>
      <View style={brandStyles.tiling}>
        {icons.map((icon) => (
          <View
            key={icon.id}
            testID={icon.id}
            style={!visibleIcons.has(icon.id) && styles.offScreen}
          >
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

export default Explorer

const styles = StyleSheet.create({
  root: { minHeight: '100vh' },
  offScreen: {
    display: 'none',
  },
  matches: {
    color: colors.primaryPress,
    opacity: 0,
    transitionDuration: '200ms',
    transitionProperty: 'opacity',
  },
  visible: {
    opacity: 1,
  },
})

function useVisibleIconIDs(query: string, initial: IconData[]): Set<string> {
  const [results, setResult] = React.useState(null)

  React.useEffect(
    debounce(() => {
      setResult(toIDSet(search(query, initial)))
    }, 50),
    [initial, query]
  )

  return results || toIDSet(initial)
}

const FIELDS = ['name', 'description', 'tags']

function search(query: string, icons: IconData[]) {
  const searcher = new FuzzySearch(icons, FIELDS)
  const result = searcher.search(query)
  return result
}

function toIDSet(initial: IconData[]): Set<string> {
  return new Set(initial.map((icon) => icon.id))
}

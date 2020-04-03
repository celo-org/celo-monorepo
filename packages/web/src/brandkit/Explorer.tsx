import { debounce } from 'debounce'
import * as React from 'react'
import FuzzySearch from 'fuzzy-search'
import { View } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import IconShowcase from 'src/brandkit/common/Showcase'
import Search, { useSearch } from 'src/brandkit/Search'
import { AssetTypes } from 'src/brandkit/tracking'
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

  const result = useFilteredResult(query, icons)

  return (
    <View style={{ minHeight: '100vh' }}>
      <Search value={query} onChange={onQueryChange} />
      <View style={brandStyles.tiling}>
        {result.map((icon) => (
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
        ))}
      </View>
    </View>
  )
}

function search(query: string, icons: IconData[]) {
  const searcher = new FuzzySearch(icons, ['name', 'description'])
  const result = searcher.search(query)
  return result
}

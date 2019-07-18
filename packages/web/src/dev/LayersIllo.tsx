import * as React from 'react'
import { StyleSheet } from 'react-native'
import { Path } from 'src/shared/svg'
import { colors } from 'src/styles'
import Svg from 'svgs'

const VECTORS = [
  'M14.5328 23.5C9.62669 23.5 7.17556 17.563 10.6527 14.1019L20.0749 4.72328C22.7922 2.0185 26.4702 0.50002 30.3042 0.50002L440.651 0.500001C444.611 0.500001 448.399 2.1194 451.134 4.98215L459.943 14.2001C463.287 17.6993 460.807 23.5 455.967 23.5L14.5328 23.5Z',
  'M11.4193 151.5C6.98843 151.5 4.37635 146.529 6.89001 142.88L20.0519 123.774C22.7579 119.846 27.2227 117.5 31.9927 117.5L438.961 117.5C443.849 117.5 448.409 119.964 451.089 124.053L463.495 142.985C465.892 146.643 463.268 151.5 458.895 151.5L11.4193 151.5Z',
  'M9.24998 289.5C5.26577 289.5 2.60346 285.396 4.22786 281.758L20.6009 245.088C22.9335 239.864 28.1198 236.5 33.841 236.5L437.139 236.5C442.956 236.5 448.211 239.977 450.485 245.332L465.995 281.85C467.536 285.477 464.874 289.5 460.933 289.5L9.24998 289.5Z',
]

interface Props {
  activeLayer: number
  onSelectLayer: (index: number) => void
}

export default React.memo<Props>(function LayersIllo({ activeLayer, onSelectLayer }: Props) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 470 290" fill="none">
      {VECTORS.map((vector, index) => {
        const onPress = () => onSelectLayer(index)
        return (
          <Path
            key={vector}
            d={vector}
            onPress={onPress}
            style={[styles.clicky, activeLayer === index ? styles.active : styles.inactive]}
            stroke={colors.screenGray}
            fill={'transparent'}
          />
        )
      })}
    </Svg>
  )
})

const styles = StyleSheet.create({
  active: {
    opacity: 1,
    transform: [{ scale: 1 }],
    transitionProperty: 'opacity transform',
    transitionDuration: '1s',
  },
  inactive: {
    transitionProperty: 'opacity transform',
    transitionDuration: '1s',
    transform: [{ scale: 0.95 }, { translateX: 10 }],
    opacity: 0.5,
  },
  clicky: {
    cursor: 'pointer',
  },
})

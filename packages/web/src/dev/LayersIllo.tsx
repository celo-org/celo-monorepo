import * as React from 'react'
import { StyleSheet } from 'react-native'
import { Path } from 'src/shared/svg'
import { colors } from 'src/styles'
import Svg from 'svgs'

const VECTORS = [
  'M15.489 18.5002C10.5885 18.5002 8.13484 12.5749 11.6006 9.11039L15.6851 5.02734C18.4043 2.3092 22.0916 0.78225 25.9363 0.78225L341.756 0.782236C345.727 0.782236 349.524 2.41039 352.261 5.28674L355.993 9.20877C359.325 12.711 356.843 18.5002 352.008 18.5002L15.489 18.5002Z',
  'M12.1119 78.7062C7.6596 78.7062 5.05238 73.6922 7.60944 70.0475L15.2772 59.118C17.9916 55.249 22.4212 52.9457 27.1473 52.9457L340.66 52.9457C345.505 52.9457 350.031 55.3663 352.721 59.3969L359.899 70.1532C362.338 73.8081 359.718 78.7062 355.324 78.7062L12.1119 78.7062Z',
  'M11.0276 146.5C6.86963 146.5 4.21536 142.064 6.18095 138.4L15.9738 120.146C18.4993 115.438 23.4089 112.5 28.7513 112.5L339.954 112.5C345.404 112.5 350.393 115.556 352.87 120.409L362.101 138.5C363.969 142.16 361.311 146.5 357.202 146.5L11.0276 146.5Z',
]

export interface Props {
  activeLayer: number | 'all'
  onSelectLayer: (index: number) => void
}

export default React.memo<Props>(function LayersIllo({ activeLayer, onSelectLayer }: Props) {
  return (
    <Svg width="100%" height="290px" viewBox="0 0 367 147" fill="none">
      {VECTORS.map((vector, index) => {
        const onPress = () => onSelectLayer(index)
        return (
          <Path
            key={vector}
            d={vector}
            onPress={onPress}
            style={[
              styles.clicky,
              activeLayer === 'all' || activeLayer === index ? styles.active : styles.inactive,
            ]}
            stroke={colors.white}
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

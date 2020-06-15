import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { brandStyles } from 'src/experience/common/constants'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { standardStyles } from 'src/styles'

interface TripplePairingProps {
  first: React.ReactNode
  second: React.ReactNode
  third: React.ReactNode
}

export default withScreenSize<TripplePairingProps>(function TripplePairing({
  first,
  second,
  third,
  screen,
}: TripplePairingProps & ScreenProps) {
  return (
    <View style={screen === ScreenSizes.DESKTOP ? brandStyles.tiling : {}}>
      {[first, second, third].map((pair, index) => {
        return (
          <View
            style={screen === ScreenSizes.DESKTOP ? styles.desktop : standardStyles.row}
            key={index}
          >
            {pair}
          </View>
        )
      })}
    </View>
  )
})

const styles = StyleSheet.create({
  desktop: { flex: 1 },
})

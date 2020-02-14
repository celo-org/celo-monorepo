import * as React from 'react'
import { View } from 'react-native'
import Sweep from 'src/community/connect/Sweep'
import { colors } from 'src/styles'

export default function Collective() {
  return (
    <View style={{ backgroundColor: colors.dark, height: '100vh' }}>
      <View style={{ transform: [{ translateY: -200 }] }}>
        <Sweep>{}</Sweep>
      </View>
    </View>
  )
}

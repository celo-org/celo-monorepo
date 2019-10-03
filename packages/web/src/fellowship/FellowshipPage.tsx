import * as React from 'react'
import { View } from 'react-native'
import FellowCover from 'src/fellowship/FellowCover'
import FellowSection from 'src/fellowship/FellowSection'
import { HEADER_HEIGHT } from 'src/shared/Styles'

export default function FellowshipPage() {
  return (
    <View style={{ marginTop: HEADER_HEIGHT }}>
      <FellowCover />
      <FellowSection />
    </View>
  )
}

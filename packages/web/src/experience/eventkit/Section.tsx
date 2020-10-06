import * as React from 'react'
import { View } from 'react-native'
import { brandStyles } from 'src/experience/common/constants'
import Markdown from 'src/experience/Markdown'
import { standardStyles } from 'src/styles'

export default function Section({ content }) {
  return (
    <View style={[brandStyles.gap, standardStyles.elementalMarginBottom]}>
      <Markdown source={content} />
    </View>
  )
}

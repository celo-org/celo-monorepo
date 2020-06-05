import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import { brandStyles } from 'src/experience/common/constants'
import { H1, H4 } from 'src/fonts/Fonts'
import { standardStyles } from 'src/styles'

interface Props {
  headline?: string
  title: string
  style?: ViewStyle
}

export default React.memo(function PageHeadline({ headline, title, style }: Props) {
  return (
    <View style={[brandStyles.gap, style]}>
      <H1 style={standardStyles.elementalMarginBottom}>{title}</H1>
      {headline && <H4>{headline}</H4>}
    </View>
  )
})

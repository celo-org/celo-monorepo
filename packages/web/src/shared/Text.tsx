import * as React from 'react'
import { Text, View } from 'react-native'

import { TextStyles } from 'src/shared/Styles'

interface Props {
  style?: any
  children?: any
  tabIndex?: number
  accessibilityRole?: 'button' | 'label' | 'link' | 'heading' | 'listitem'
}

export const TABLE = ({ style, children }: Props) => {
  return <View style={[TextStyles.table, style]}>{children}</View>
}

export const TR = ({ style, children }: Props) => {
  return <View style={[TextStyles.tr, style]}>{children}</View>
}

export const TH = ({ style, children }: Props) => {
  return <Text style={[TextStyles.smallMain, TextStyles.th, style]}>{children}</Text>
}

export const TD = ({ style, children }: Props) => {
  return <Text style={[TextStyles.smallMain, TextStyles.td, style]}>{children}</Text>
}

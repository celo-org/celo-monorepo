import Touchable, { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import * as React from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'

export type Props = Omit<TouchableProps, 'style'> & {
  style?: StyleProp<TextStyle>
}

// unstyled Touchable Text, good for making other Text Buttons such as TopBarButton
export default function BoarderlessButton(props: Props) {
  const { style, children, ...passThroughProps } = props
  return (
    <Touchable {...passThroughProps} borderless={true}>
      <Text style={style}>{children}</Text>
    </Touchable>
  )
}

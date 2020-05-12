import Touchable, { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import * as React from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'

type Props = TouchableProps & {
  style?: StyleProp<TextStyle>
  testID?: string
}

// unstyled Touchable Text, good for making other Text Buttons such as TopBarButton
export default function BoarderlessButton(props: Props) {
  const { onPress, style, children, disabled, testID } = props
  return (
    <Touchable onPress={onPress} borderless={true} disabled={disabled} testID={testID}>
      <Text style={style}>{children}</Text>
    </Touchable>
  )
}

import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native'

type Props = TouchableOpacityProps & {
  textStyle?: StyleProp<TextStyle>
  testID?: string
  title: string
}

export default function TopBarButton({ onPress, textStyle, title, disabled, testID }: Props) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID}>
      <Text style={textStyle ? [styles.text, textStyle] : styles.text}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  text: {
    ...fontStyles.regular,
    color: colors.greenUI,
    paddingHorizontal: 16,
  },
})

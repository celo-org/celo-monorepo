import FormUnderline from '@celo/react-components/components/FormUnderline'
import TextInput, { TextInputProps } from '@celo/react-components/components/TextInput.v2'
import colors from '@celo/react-components/styles/colors'
import React from 'react'
import { View } from 'react-native'

export type Props = TextInputProps

export default function FormTextInput({ style, inputStyle, ...passThroughProps }: Props) {
  return (
    <View style={style}>
      <TextInput
        inputStyle={inputStyle}
        placeholderTextColor={colors.gray3}
        underlineColorAndroid="transparent"
        {...passThroughProps}
      />
      <FormUnderline />
    </View>
  )
}

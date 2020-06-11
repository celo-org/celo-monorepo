import FormUnderline from '@celo/react-components/components/FormUnderline'
import TextInput, { TextInputProps } from '@celo/react-components/components/TextInput.v2'
import colors from '@celo/react-components/styles/colors.v2'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export type Props = TextInputProps

export default function FormTextInput({ style, inputStyle, ...passThroughProps }: Props) {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        inputStyle={[styles.input, inputStyle]}
        placeholderTextColor={colors.gray3}
        underlineColorAndroid="transparent"
        {...passThroughProps}
      />
      <FormUnderline />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor: 'green',
  },
  input: {
    // backgroundColor: undefined,
  },
})

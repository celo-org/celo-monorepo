import FormField from '@celo/react-components/components/FormField'
import FormTextInput, {
  Props as FormTextInputProps,
} from '@celo/react-components/components/FormTextInput'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'

type Props = Omit<FormTextInputProps, 'style'> & {
  style?: StyleProp<ViewStyle>
  label: string
}

export default function FormInput({ style, label, ...passThroughProps }: Props) {
  return (
    <FormField label={label} style={style}>
      <FormTextInput {...passThroughProps} />
    </FormField>
  )
}

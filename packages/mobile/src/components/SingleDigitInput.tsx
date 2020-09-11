import TextInput from '@celo/react-components/components/TextInput'
import colors from '@celo/react-components/styles/colors'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { StyleSheet } from 'react-native'

export interface SingleDigitInputProps {
  inputValue: string
  inputPlaceholder: string
  onInputChange: (value: string) => void
}

type Props = SingleDigitInputProps

export function SingleDigitInput({ inputValue, inputPlaceholder, onInputChange }: Props) {
  return (
    <TextInput
      value={inputValue}
      placeholder={inputPlaceholder}
      onChangeText={onInputChange}
      maxLength={1}
      showClearButton={false}
      style={styles.codeInput}
    />
  )
}

const styles = StyleSheet.create({
  codeInput: {
    ...componentStyles.roundedBorder,
    flex: 0,
    backgroundColor: '#FFF',
    borderColor: colors.gray2,
    height: 50,
    width: 50,
    marginVertical: 5,
  },
})

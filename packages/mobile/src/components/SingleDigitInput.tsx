import TextInput from '@celo/react-components/components/TextInput'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet } from 'react-native'

export interface SingleDigitInputProps {
  inputValue: string
  inputPlaceholder: string
  onInputChange: (value: string) => void
  testID?: string
}

type Props = SingleDigitInputProps

export function SingleDigitInput({ inputValue, inputPlaceholder, onInputChange, testID }: Props) {
  return (
    <TextInput
      value={inputValue}
      placeholder={inputPlaceholder}
      onChangeText={onInputChange}
      maxLength={1}
      showClearButton={false}
      style={styles.codeInput}
      testID={testID}
    />
  )
}

const styles = StyleSheet.create({
  codeInput: {
    borderColor: colors.gray2,
    borderRadius: 3,
    borderWidth: 1,
    flex: 0,
    backgroundColor: '#FFF',
    height: 50,
    width: 50,
    marginVertical: 5,
  },
})

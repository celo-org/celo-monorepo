import TextInputWithButtons from '@celo/react-components/components/TextInputWithButtons'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { StyleSheet, Text, TextInputProps, TouchableOpacity, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from 'src/redux/reducers'

interface Props {
  inputContainerStyle?: ViewStyle
  inputStyle?: TextInputProps['style']
  celo: string
  onCeloChanged: (address: string) => void
  color?: string
}

export default function CeloAmountInput({
  inputContainerStyle,
  inputStyle,
  celo,
  onCeloChanged,
  color = colors.goldUI,
}: Props) {
  const goldBalance = useSelector((state: RootState) => state.goldToken.balance)

  const setMaxAmount = () => {
    if (goldBalance) {
      onCeloChanged(goldBalance)
    }
  }

  return (
    <TextInputWithButtons
      style={inputContainerStyle}
      inputStyle={inputStyle}
      placeholder={'0'}
      placeholderTextColor={colors.gray3}
      keyboardType={'decimal-pad'}
      onChangeText={onCeloChanged}
      value={celo}
      testID={'CeloAmount'}
    >
      <TouchableOpacity testID={'MaxAmount'} onPress={setMaxAmount}>
        <Text style={[styles.maxAmount, { color }]}>{'Max'}</Text>
      </TouchableOpacity>
    </TextInputWithButtons>
  )
}

const styles = StyleSheet.create({
  maxAmount: fontStyles.small600,
})

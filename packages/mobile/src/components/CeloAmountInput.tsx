import TextInputWithButtons from '@celo/react-components/components/TextInputWithButtons'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import { useSelector } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { RootState } from 'src/redux/reducers'

interface Props {
  inputContainerStyle?: ViewStyle
  inputStyle?: TextInputProps['style']
  celo: string
  onCeloChanged: (address: string) => void
  color?: string
  feeEstimate: BigNumber | undefined
}

export default function CeloAmountInput({
  inputContainerStyle,
  inputStyle,
  celo,
  onCeloChanged,
  color = colors.goldUI,
  feeEstimate,
}: Props) {
  const { t } = useTranslation(Namespaces.exchangeFlow9)
  const goldBalance = useSelector((state: RootState) => state.goldToken.balance)

  const setMaxAmount = () => {
    if (goldBalance && feeEstimate) {
      const maxValue = new BigNumber(goldBalance).minus(feeEstimate)
      onCeloChanged(maxValue.isPositive() ? maxValue.toString() : '0')
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
      {feeEstimate ? (
        <TouchableOpacity testID={'MaxAmount'} onPress={setMaxAmount}>
          <Text style={[styles.maxAmount, { color }]}>{t('maxSymbol')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.goldUI} />
        </View>
      )}
    </TextInputWithButtons>
  )
}

const styles = StyleSheet.create({
  maxAmount: fontStyles.small600,
  loadingContainer: {},
})

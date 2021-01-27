import TextInputWithButtons from '@celo/react-components/components/TextInputWithButtons'
import Touchable from '@celo/react-components/components/Touchable'
import QRCodeBorderlessIcon from '@celo/react-components/icons/QRCodeBorderless'
import colors from '@celo/react-components/styles/colors'
import React from 'react'
import { StyleSheet, TextInputProps, ViewStyle } from 'react-native'
import ClipboardAwarePasteIcon from 'src/components/ClipboardAwarePasteIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface Props {
  inputContainerStyle?: ViewStyle
  inputStyle?: TextInputProps['style']
  accountAddress: string
  onAddressChanged: (address: string) => void
  color?: string
}

export default function AccountAddressInput({
  inputContainerStyle,
  inputStyle,
  accountAddress,
  onAddressChanged,
  color = colors.goldUI,
}: Props) {
  const onPressQrCode = () => {
    navigate(Screens.WithdrawCeloQrScannerScreen, {
      onAddressScanned: onAddressChanged,
    })
  }

  return (
    <TextInputWithButtons
      style={inputContainerStyle}
      inputStyle={inputStyle}
      placeholder={'0x1234...5678'}
      placeholderTextColor={colors.gray3}
      onChangeText={onAddressChanged}
      value={accountAddress}
      testID={'AccountAddress'}
    >
      <ClipboardAwarePasteIcon
        style={styles.paste}
        onChangeText={onAddressChanged}
        color={color}
        value={accountAddress}
        testID={'PasteButton'}
      />
      <Touchable testID={'ScanQR'} borderless={true} onPress={onPressQrCode}>
        <QRCodeBorderlessIcon height={32} color={color} />
      </Touchable>
    </TextInputWithButtons>
  )
}

const styles = StyleSheet.create({
  paste: {
    marginRight: 8,
  },
})

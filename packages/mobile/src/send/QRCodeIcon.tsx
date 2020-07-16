import Touchable from '@celo/react-components/components/Touchable'
import QRCode from '@celo/react-components/icons/QRCode'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

export function QRCodeIcon() {
  const onQrCodePress = React.useCallback(() => {
    navigate(Screens.QRNavigator, { screen: Screens.QRScanner })
  }, [])

  return (
    <Touchable onPress={onQrCodePress} style={style.qrCodeContainer}>
      <QRCode height={28} />
    </Touchable>
  )
}

const style = StyleSheet.create({
  qrCodeContainer: {
    paddingRight: 15,
  },
})

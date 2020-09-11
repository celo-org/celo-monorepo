// SCREEN that scans QRs and calls |onAddressScanned| param when one is found.

import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { componentStyles } from '@celo/react-components/styles/styles'
import { StackScreenProps } from '@react-navigation/stack'
import { memoize } from 'lodash'
import React from 'react'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton.v2'
import { ADDRESS_LENGTH } from 'src/exchange/reducer'
import i18n from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers.v2'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import QRScanner from 'src/qrcode/QRScanner'
import { uriDataFromUrl } from 'src/qrcode/schema'
import { QrCode } from 'src/send/actions'
import Logger from 'src/utils/Logger'

const TAG = 'WithdrawCeloQrScannerScreen'

type Props = StackScreenProps<StackParamList, Screens.WithdrawCeloQrScannerScreen>

function fetchAddressFromQrData(data: string): string | null {
  try {
    return uriDataFromUrl(data).address
  } catch (error) {
    return null
  }
}

function WithdrawCeloQrScannerScreen({ route }: Props) {
  const { onAddressScanned } = route.params
  const dispatch = useDispatch()

  const onBarCodeDetected = memoize(
    (qrCode: QrCode) => {
      const qrData = qrCode.data
      Logger.debug(TAG, 'Bar code detected: ' + qrData)
      const address = fetchAddressFromQrData(qrData) || qrData
      if (address.startsWith('0x') && address.length === ADDRESS_LENGTH) {
        onAddressScanned(address)
        navigateBack()
      } else {
        dispatch(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
      }
    },
    (qrCode) => qrCode.data
  )

  return <QRScanner onBarCodeDetected={onBarCodeDetected} />
}

WithdrawCeloQrScannerScreen.navigationOptions = () => {
  return {
    ...nuxNavigationOptions,
    headerLeft: () => <BackButton color={colors.light} />,
    headerTitle: i18n.t('exchangeFlow9:withdrawScanQrTitle'),
    headerTitleStyle: {
      ...fontStyles.navigationHeader,
      ...componentStyles.screenHeader,
      color: colors.light,
    },
  }
}

export default WithdrawCeloQrScannerScreen

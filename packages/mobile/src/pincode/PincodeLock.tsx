/**
 * This is a VIEW, which we use as an overlay, when we need
 * to lock the app with a PIN code.
 */
import colors from '@celo/react-components/styles/colors'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, StyleSheet } from 'react-native'
import RNExitApp from 'react-native-exit-app'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { appUnlock } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces } from 'src/i18n'
import { checkPin } from 'src/pincode/authentication'
import Pincode from 'src/pincode/Pincode'
import { currentAccountSelector } from 'src/web3/selectors'

function PincodeLock() {
  const [pin, setPin] = useState('')
  const [errorText, setErrorText] = useState<string | undefined>(undefined)
  const dispatch = useDispatch()
  const { t } = useTranslation(Namespaces.nuxNamePin1)
  const account = useSelector(currentAccountSelector)

  const onWrongPin = () => {
    setPin('')
    setErrorText(t(`${Namespaces.global}:${ErrorMessages.INCORRECT_PIN}`))
  }

  const onCorrectPin = () => {
    dispatch(appUnlock())
  }

  const onCompletePin = async (enteredPin: string) => {
    if (!account) {
      throw new Error('Attempting to unlock pin before account initialized')
    }

    if (await checkPin(enteredPin, account)) {
      onCorrectPin()
    } else {
      onWrongPin()
    }
  }

  useEffect(() => {
    function hardwareBackPress() {
      RNExitApp.exitApp()
      return true
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', hardwareBackPress)
    return function cleanup() {
      backHandler.remove()
    }
  }, [])

  return (
    <SafeAreaView style={style.container}>
      <Pincode
        title={t('confirmPin.title')}
        errorText={errorText}
        pin={pin}
        onChangePin={setPin}
        onCompletePin={onCompletePin}
      />
    </SafeAreaView>
  )
}

const style = StyleSheet.create({
  container: {
    paddingTop: 20,
    flex: 1,
    backgroundColor: colors.light,
  },
})

export default PincodeLock

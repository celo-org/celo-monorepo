/**
 * This is a VIEW, which we use as an overlay, when we need
 * to lock the app with a PIN code.
 */
import colors from '@celo/react-components/styles/colors'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, StyleSheet } from 'react-native'
import RNExitApp from 'react-native-exit-app'
import SafeAreaView from 'react-native-safe-area-view'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { appUnlock } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces } from 'src/i18n'
import Pincode from 'src/pincode/Pincode'
import { isPinCorrect, isPinValid, PIN_LENGTH } from 'src/pincode/utils'
import { currentAccountSelector, fornoSelector } from 'src/web3/selectors'

function PincodeLock() {
  const [pin, setPin] = useState('')
  const dispatch = useDispatch()
  const { t } = useTranslation(Namespaces.nuxNamePin1)
  const fornoMode = useSelector(fornoSelector)
  const currentAccount = useSelector(currentAccountSelector)

  const onWrongPin = useCallback(() => {
    dispatch(showError(ErrorMessages.INCORRECT_PIN))
    setPin('')
  }, [dispatch, showError, setPin])

  const onCorrectPin = useCallback(() => {
    dispatch(appUnlock())
  }, [dispatch, appUnlock])

  const onPress = () => {
    if (currentAccount) {
      return isPinCorrect(pin, fornoMode, currentAccount)
        .then(onCorrectPin)
        .catch(onWrongPin)
    } else {
      onCorrectPin()
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
        placeholder={t('createPin.yourPin')}
        buttonText={t('global:submit')}
        isPinValid={isPinValid}
        onPress={onPress}
        pin={pin}
        onChangePin={setPin}
        maxLength={PIN_LENGTH}
      />
    </SafeAreaView>
  )
}

const style = StyleSheet.create({
  container: {
    paddingTop: 20,
    flex: 1,
    backgroundColor: colors.background,
  },
})

export default PincodeLock

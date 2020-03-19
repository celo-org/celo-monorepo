import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { unlock } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces } from 'src/i18n'
import Pincode from 'src/pincode/Pincode'
import { isPinCorrect, isPinValid, PIN_LENGTH } from 'src/pincode/utils'
import { currentAccountSelector, fornoSelector } from 'src/web3/selectors'

function PincodeLock() {
  const [pin, setPin] = useState('123')
  const dispatch = useDispatch()
  const { t } = useTranslation(Namespaces.nuxNamePin1)
  const fornoMode = useSelector(fornoSelector)
  const currentAccount = useSelector(currentAccountSelector)

  const onWrongPin = useCallback(() => {
    dispatch(showError(ErrorMessages.INCORRECT_PIN))
    // setPin('')
  }, [dispatch, showError, setPin])

  const onCorrectPin = useCallback(() => {
    dispatch(unlock())
  }, [dispatch, unlock])

  console.log('PIN: ', pin)
  const onPress = () => {
    if (currentAccount) {
      return isPinCorrect(pin, fornoMode, currentAccount)
        .then(onCorrectPin)
        .catch(onWrongPin)
    } else {
      onCorrectPin()
    }
  }

  return (
    <Pincode
      title={t('confirmPin.title')}
      placeholder={t('createPin.yourPin')}
      buttonText={t('global:submit')}
      isPinValid={() => true}
      onPress={onPress}
      pin={pin}
      onChangePin={setPin}
      maxLength={PIN_LENGTH}
    />
  )
}

export default PincodeLock

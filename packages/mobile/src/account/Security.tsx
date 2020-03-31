import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { setLockWithPinEnabled } from 'src/app/actions'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'

function Security() {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const dispatch = useDispatch()
  const lockWithPinEnabled = useSelector((state: RootState) => state.app.lockWithPinEnabled)
  const setLockWithPin = useCallback(
    (value: boolean) => {
      dispatch(setLockWithPinEnabled(value))
    },
    [setLockWithPinEnabled]
  )
  return (
    <ScrollView style={style.scrollView} keyboardShouldPersistTaps="handled">
      <SettingsSwitchItem switchValue={lockWithPinEnabled} onSwitchChange={setLockWithPin}>
        <Text style={fontStyles.body}>{t('requirePinOnAppOpen')}</Text>
      </SettingsSwitchItem>
    </ScrollView>
  )
}

Security.navigationOptions = () => ({
  ...headerWithBackButton,
  headerTitle: i18n.t('accountScreen10:security'),
})

const style = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

export default Security

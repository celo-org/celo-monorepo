import colors from '@celo/react-components/styles/colors'
import React, { useCallback, useEffect } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { NavigationInjectedProps, StackActions } from 'react-navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppState, lock, unlock } from 'src/app/actions'
import { getAppState, getLockWithPinEnabled } from 'src/app/selectors'
import { Screens } from 'src/navigator/Screens'
import { currentAccountSelector } from 'src/web3/selectors'

type Navigation = NavigationInjectedProps['navigation']

interface OwnProps {
  navigation: Navigation
}

type Props = OwnProps

function Background({ navigation }: Props) {
  const appState = useSelector(getAppState)
  const account = useSelector(currentAccountSelector)
  const lockWithPinEnabled = useSelector(getLockWithPinEnabled)
  const dispatch = useDispatch()

  const onUnlockCb = useCallback(() => {
    dispatch(unlock())
    const onUnlock = navigation.getParam('onUnlock')
    if (onUnlock) {
      onUnlock()
    }
  }, [dispatch, navigation])

  useEffect(() => {
    if (!lockWithPinEnabled || !account) {
      onUnlockCb()
      return
    }

    if (appState === AppState.Active) {
      navigation.dispatch(
        StackActions.replace({
          routeName: Screens.PincodeConfirmation,
          params: {
            onValidPin: onUnlockCb,
            hideBackButton: true,
          },
        })
      )
    } else if (appState === AppState.Background) {
      dispatch(lock())
    }
  }, [appState, lockWithPinEnabled])

  return <View style={styles.container} />
}

Background.navigationOptions = { header: null }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Platform.OS === 'android' ? colors.white : colors.celoGreen,
  },
})

export default Background

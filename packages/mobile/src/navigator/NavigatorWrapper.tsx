import AsyncStorage from '@react-native-community/async-storage'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { createAppContainer } from 'react-navigation'
import { connect } from 'react-redux'
import AlertBanner from 'src/alert/AlertBanner'
import { getAppLocked } from 'src/app/selectors'
import { DEV_RESTORE_NAV_STATE_ON_RELOAD } from 'src/config'
import { handleNavigationStateChange, setTopLevelNavigator } from 'src/navigator/NavigationService'
import Navigator from 'src/navigator/Navigator'
import PincodeLock from 'src/pincode/PincodeLock'
import { RootState } from 'src/redux/reducers'
import BackupPrompt from 'src/shared/BackupPrompt'
import Logger from 'src/utils/Logger'

// This uses RN Navigation's experimental nav state persistence
// to improve the hot reloading experience when in DEV mode
// https://reactnavigation.org/docs/en/state-persistence.html
function getPersistenceFunctions() {
  if (!__DEV__ || !DEV_RESTORE_NAV_STATE_ON_RELOAD) {
    return undefined
  }

  const persistenceKey = 'NAV_STATE_PERSIST_KEY'
  const persistNavigationState = async (navState: any) => {
    try {
      await AsyncStorage.setItem(persistenceKey, JSON.stringify(navState))
    } catch (e) {
      Logger.error('NavigatorWrapper', 'Error persisting nav state', e)
    }
  }
  const loadNavigationState = async () => {
    const state = await AsyncStorage.getItem(persistenceKey)
    return state && JSON.parse(state)
  }
  return {
    persistNavigationState,
    loadNavigationState,
  }
}

interface DispatchProps {
  setTopLevelNavigator: typeof setTopLevelNavigator
}

interface StateProps {
  appLocked: boolean
}

type Props = StateProps & DispatchProps & WithTranslation

const mapStateToProps = (state: RootState) => {
  return {
    appLocked: getAppLocked(state),
  }
}

const AppContainer = createAppContainer(Navigator)

export class NavigatorWrapper extends React.Component<Props> {
  setNavigator = (r: any) => {
    this.props.setTopLevelNavigator(r)
  }

  render() {
    const { appLocked } = this.props
    return (
      <View style={styles.container}>
        <AppContainer
          ref={this.setNavigator}
          onNavigationStateChange={handleNavigationStateChange}
          {...getPersistenceFunctions()}
        />
        {appLocked && (
          <View style={styles.locked}>
            <PincodeLock />
          </View>
        )}
        <View style={styles.floating}>
          {!appLocked && <BackupPrompt />}
          <AlertBanner />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  floating: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
  },
  locked: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
})

export const navbarStyle: {
  headerMode: 'none'
} = {
  headerMode: 'none',
}

export const headerArea = {
  navigationOptions: {
    headerStyle: {
      elevation: 0,
    },
  },
}

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  setTopLevelNavigator,
})(NavigatorWrapper)

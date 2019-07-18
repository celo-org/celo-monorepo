import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { createAppContainer, NavigationState } from 'react-navigation'
import { connect } from 'react-redux'
import AlertBanner from 'src/alert/AlertBanner'
import { recordStateChange, setTopLevelNavigator } from 'src/navigator/NavigationService'
import Navigator from 'src/navigator/Navigator'
import BackupPrompt from 'src/shared/BackupPrompt'

const navigationStateChange = (prev: NavigationState, current: NavigationState) =>
  recordStateChange(prev, current)

interface DispatchProps {
  setTopLevelNavigator: typeof setTopLevelNavigator
}

type Props = DispatchProps

const AppContainer = createAppContainer(Navigator)

export class NavigatorWrapper extends React.Component<Props> {
  setNavigator = (r: any) => {
    this.props.setTopLevelNavigator(r)
  }

  render() {
    return (
      <View style={styles.container}>
        <AlertBanner />
        <BackupPrompt />
        <AppContainer ref={this.setNavigator} onNavigationStateChange={navigationStateChange} />
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

export default connect<null, DispatchProps>(
  null,
  {
    setTopLevelNavigator,
  }
)(NavigatorWrapper)

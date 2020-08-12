import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { devModeTriggerClicked } from 'src/account/actions'
import { devModeSelector } from 'src/account/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  devModeActive: boolean
}

interface DispatchProps {
  devModeTriggerClicked: typeof devModeTriggerClicked
}

type Props = { nextScreen: keyof StackParamList; onSkip?: () => void } & StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    devModeActive: devModeSelector(state) || false,
  }
}

class DevSkipButton extends React.Component<Props> {
  skip = () => {
    if (this.props.onSkip) {
      this.props.onSkip()
    }
    navigate(this.props.nextScreen)
  }

  showDebug = () => {
    navigate(Screens.Debug)
  }

  devTriggerClicked = () => {
    this.props.devModeTriggerClicked()
  }

  render() {
    return (
      <SafeAreaView style={styles.devButtonContainer}>
        {this.props.devModeActive && (
          <View style={styles.devButtonContent}>
            <TouchableOpacity
              style={[styles.devButton, styles.debugButton]}
              onPress={this.showDebug}
              testID={'ButtonDevScreen'}
            />
            <TouchableOpacity
              style={[styles.devButton, styles.skipButton]}
              onPress={this.skip}
              testID={`ButtonSkipTo${this.props.nextScreen}`}
            />
          </View>
        )}
        {!this.props.devModeActive && (
          <TouchableWithoutFeedback style={styles.hiddenButton} onPress={this.devTriggerClicked}>
            <Text>{'   '}</Text>
          </TouchableWithoutFeedback>
        )}
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  devButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 60,
    height: 35,
    zIndex: 100,
  },
  devButtonContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  devButton: {
    width: 25,
    height: 25,
  },
  skipButton: {
    backgroundColor: colors.warning,
  },
  debugButton: {
    backgroundColor: colors.onboardingBlue,
  },
  hiddenButton: {
    flex: 1,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  devModeTriggerClicked,
})(DevSkipButton)

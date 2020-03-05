import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { connect } from 'react-redux'
import { devModeTriggerClicked } from 'src/account/actions'
import { devModeSelector } from 'src/account/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  devModeActive: boolean
}

interface DispatchProps {
  devModeTriggerClicked: typeof devModeTriggerClicked
}

type Props = { nextScreen: Screens; onSkip?: () => void } & StateProps & DispatchProps

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
      <View style={styles.devButtonContainer}>
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
      </View>
    )
  }
}

const styles = StyleSheet.create({
  devButtonContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 70,
    height: 35,
    zIndex: 100,
    paddingRight: 10,
    paddingTop: 10,
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
    backgroundColor: colors.errorRed,
  },
  debugButton: {
    backgroundColor: colors.messageBlue,
  },
  hiddenButton: {
    flex: 1,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  devModeTriggerClicked,
})(DevSkipButton)

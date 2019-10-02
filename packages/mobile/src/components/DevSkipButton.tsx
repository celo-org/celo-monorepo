import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { connect } from 'react-redux'
import { devModeTriggerClicked } from 'src/account/actions'
import { devModeSelector } from 'src/account/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  devModeActive: boolean
}

interface DispatchProps {
  devModeTriggerClicked: typeof devModeTriggerClicked
}

type Props = { nextScreen: Screens } & StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    devModeActive: devModeSelector(state) || false,
  }
}

export class DevSkipButton extends React.Component<Props> {
  skip = () => {
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
    // Stop gap solution until we properly fix layout on iOS
    top: Platform.OS === 'ios' ? 100 : 0,
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

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  { devModeTriggerClicked }
)(DevSkipButton)

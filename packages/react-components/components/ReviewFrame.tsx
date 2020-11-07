import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import CircleButton from '@celo/react-components/components/CircleButton'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, View, ViewProps } from 'react-native'

interface ButtonProps {
  text: string
  disabled?: boolean
  action(): void
}

interface Props extends ViewProps {
  navigateBack?: () => void
  confirmButton?: ButtonProps
  modifyButton?: ButtonProps
  HeaderComponent?: React.ComponentType<any>
  FooterComponent?: React.FunctionComponent
  LabelAboveKeyboard?: React.FunctionComponent
  isSending?: boolean
}

interface State {
  keyboardVisible: boolean
}

class ReviewFrame extends React.PureComponent<Props, State> {
  state: State = {
    keyboardVisible: false,
  }

  onConfirm = () => {
    if (this.props.confirmButton) {
      this.props.confirmButton.action()
    }
  }

  onToggleKeyboard = (visible: boolean) => {
    this.setState({ keyboardVisible: visible })
  }

  renderButtons = () => {
    const { navigateBack, confirmButton, modifyButton, FooterComponent, isSending } = this.props

    if (confirmButton || modifyButton) {
      return (
        <View style={styles.bottomButtonStyle}>
          {confirmButton && (
            <Button
              onPress={this.onConfirm}
              text={confirmButton.text}
              showLoading={isSending}
              accessibilityLabel={confirmButton.text}
              type={BtnTypes.PRIMARY}
              size={BtnSizes.FULL}
              style={styles.confirmButton}
              disabled={confirmButton.disabled}
              testID="ConfirmButton"
            />
          )}
          {modifyButton && (
            <Button
              onPress={modifyButton.action}
              text={modifyButton.text}
              accessibilityLabel={modifyButton.text}
              type={BtnTypes.SECONDARY}
              size={BtnSizes.FULL}
              disabled={modifyButton.disabled}
              style={styles.modifyButton}
            />
          )}
        </View>
      )
    } else if (navigateBack) {
      return (
        <View style={styles.circleButtonContainer}>
          <CircleButton onPress={navigateBack} solid={true} disabled={false} />
        </View>
      )
    } else if (!FooterComponent) {
      throw new Error(
        'Review Frame must be provided confirm/modify buttons, navigateBack callback, or other Footer component to navigate away from screen'
      )
    }
  }

  render() {
    const { HeaderComponent, FooterComponent, LabelAboveKeyboard, style, children } = this.props

    return (
      <View style={[styles.body, style]}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollViewContentContainer}
          keyboardShouldPersistTaps={'handled'}
        >
          {HeaderComponent && <HeaderComponent />}
          <View style={styles.confirmationContainer}>{children}</View>
        </KeyboardAwareScrollView>
        {!this.state.keyboardVisible && (
          <>
            {FooterComponent && <FooterComponent />}
            {this.renderButtons()}
          </>
        )}
        {this.state.keyboardVisible && LabelAboveKeyboard && <LabelAboveKeyboard />}
        <KeyboardSpacer onToggle={this.onToggleKeyboard} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.light,
  },
  scrollViewContentContainer: {
    paddingVertical: 10,
  },
  confirmationContainer: {
    marginHorizontal: 16,
  },
  circleButtonContainer: {
    marginVertical: 20,
  },
  bottomButtonStyle: {
    marginHorizontal: 16,
    paddingVertical: 16,
  },
  modifyButton: {
    marginBottom: 10,
  },
  confirmButton: {
    marginBottom: 16,
  },
})

export default ReviewFrame

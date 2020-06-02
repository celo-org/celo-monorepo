import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import CircleButton from '@celo/react-components/components/CircleButton'
import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View, ViewProps } from 'react-native'

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
  shouldReset?: boolean
  isSending?: boolean
}

interface State {
  confirmed: boolean
}

class ReviewFrame extends React.PureComponent<Props, State> {
  state = {
    confirmed: false,
  }

  onConfirm = () => {
    this.setState({ confirmed: true })
    if (this.props.confirmButton) {
      this.props.confirmButton.action()
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.shouldReset === false && this.props.shouldReset === true) {
      this.setState({ confirmed: false })
    }
  }

  renderButtons = () => {
    const { navigateBack, confirmButton, modifyButton, FooterComponent, isSending } = this.props

    if (confirmButton || modifyButton) {
      return (
        <View style={styles.bottomButtonStyle}>
          {confirmButton && (
            <Button
              onPress={this.onConfirm}
              text={
                isSending ? (
                  <ActivityIndicator size="small" color={colors.celoGreen} />
                ) : (
                  confirmButton.text
                )
              }
              accessibilityLabel={confirmButton.text}
              type={BtnTypes.PRIMARY}
              size={BtnSizes.FULL}
              disabled={confirmButton.disabled || this.state.confirmed}
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
    const { HeaderComponent, FooterComponent, style, children } = this.props

    return (
      <View style={[styles.body, style]}>
        <ScrollView contentContainerStyle={styles.scrollViewContentContainer}>
          {HeaderComponent && <HeaderComponent />}
          <View style={styles.confirmationContainer}>{children}</View>
        </ScrollView>
        {FooterComponent && <FooterComponent />}
        {this.renderButtons()}
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
    marginHorizontal: 20,
  },
  modifyButton: {
    marginBottom: 10,
  },
})

export default ReviewFrame

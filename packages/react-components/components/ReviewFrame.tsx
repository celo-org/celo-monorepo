import Button, { BtnTypes } from '@celo/react-components/components/Button'
import CircleButton from '@celo/react-components/components/CircleButton'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { ScrollView, StyleSheet, View, ViewProps } from 'react-native'

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
  FooterComponent?: React.ComponentType<any>
  shouldReset?: boolean
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
    const { navigateBack, confirmButton, modifyButton, FooterComponent } = this.props

    if (confirmButton || modifyButton) {
      return (
        <View style={styles.bottomButtonStyle}>
          {confirmButton && (
            <Button
              onPress={this.onConfirm}
              text={confirmButton.text}
              accessibilityLabel={confirmButton.text}
              standard={true}
              type={BtnTypes.PRIMARY}
              disabled={confirmButton.disabled || this.state.confirmed}
            />
          )}
          {modifyButton && (
            <Button
              onPress={modifyButton.action}
              text={modifyButton.text}
              accessibilityLabel={modifyButton.text}
              standard={false}
              type={BtnTypes.SECONDARY}
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
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollViewContentContainer: {
    paddingVertical: 10,
    justifyContent: 'flex-start',
  },
  confirmationContainer: {
    marginVertical: 20,
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

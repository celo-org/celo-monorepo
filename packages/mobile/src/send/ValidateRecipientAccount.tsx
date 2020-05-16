import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'
import { SingleDigitInput } from 'src/components/SingleDigitInput'
import { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { validateRecipientAddress } from 'src/send/actions'
import { TransactionDataInput } from 'src/send/SendAmount'

const FULL_ADDRESS_PLACEHOLDER = '0xf1b1d5a6e7728g309c4a025k122d71ad75a61976'
const PARTIAL_ADDRESS_PLACEHOLDER = ['k', '0', 'F', '4']

type Navigation = NavigationInjectedProps['navigation']

interface OwnProps {
  navigation: Navigation
}

interface StateProps {
  recipient: Recipient
  transactionData: TransactionDataInput
  fullValidationRequired: boolean
  isValidRecipient: boolean
  isPaymentRequest: true | undefined
}

interface State {
  inputValue: string
  singleDigitInputValueArr: string[]
  isModalVisible: boolean
}

interface DispatchProps {
  validateRecipientAddress: typeof validateRecipientAddress
}

const mapDispatchToProps = {
  validateRecipientAddress,
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { navigation } = ownProps
  const transactionData = navigation.getParam('transactionData')
  const isPaymentRequest = navigation.getParam('isPaymentRequest')
  const { recipient } = transactionData
  return {
    recipient,
    transactionData,
    fullValidationRequired: navigation.getParam('fullValidationRequired'),
    isValidRecipient: state.send.isValidRecipient,
    isPaymentRequest,
  }
}

type Props = StateProps & DispatchProps & WithTranslation & NavigationInjectedProps

export class ValidateRecipientAccount extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  state: State = {
    inputValue: '',
    singleDigitInputValueArr: [],
    isModalVisible: false,
  }

  componentDidUpdate = (prevProps: Props) => {
    const { isValidRecipient, isPaymentRequest, transactionData } = this.props
    if (isValidRecipient && !prevProps.isValidRecipient) {
      if (isPaymentRequest) {
        navigate(Screens.PaymentRequestConfirmation, { transactionData })
      } else {
        navigate(Screens.SendConfirmation, { transactionData })
      }
    }
  }

  onPressConfirm = () => {
    const { inputValue, singleDigitInputValueArr } = this.state
    const { recipient, fullValidationRequired } = this.props
    const inputToValidate = fullValidationRequired ? inputValue : singleDigitInputValueArr.join('')
    this.props.validateRecipientAddress(inputToValidate, fullValidationRequired, recipient)
  }

  onInputChange = (value: string) => {
    this.setState({ inputValue: value })
  }

  onSingleDigitInputChange = (value: string, index: number) => {
    const { singleDigitInputValueArr } = this.state
    singleDigitInputValueArr[index] = value
    this.setState({ singleDigitInputValueArr })
  }

  toggleModal = () => {
    this.setState({ isModalVisible: !this.state.isModalVisible })
  }

  shouldShowClipboard = () => false

  renderInstructionsAndInputField = () => {
    const { t, recipient, fullValidationRequired } = this.props
    const { inputValue, singleDigitInputValueArr } = this.state
    const { displayName } = recipient

    if (fullValidationRequired) {
      return (
        <View>
          <Text style={styles.body}>
            {t('confirmAccountNumber.body1Full', {
              displayName,
            })}
          </Text>
          <Text style={styles.body}>{t('confirmAccountNumber.body2Full')}</Text>
          <Text style={styles.codeHeader}>{t('accountInputHeaderFull')}</Text>
          <CodeRow
            status={CodeRowStatus.INPUTTING}
            inputValue={inputValue}
            inputPlaceholder={FULL_ADDRESS_PLACEHOLDER}
            onInputChange={this.onInputChange}
            shouldShowClipboard={this.shouldShowClipboard}
          />
        </View>
      )
    }

    const singleDigitInputComponentArr = PARTIAL_ADDRESS_PLACEHOLDER.map(
      (placeholderValue, index) => (
        <View style={styles.singleDigitInputWrapper} key={placeholderValue}>
          <SingleDigitInput
            inputValue={singleDigitInputValueArr[index]}
            inputPlaceholder={placeholderValue}
            // tslint:disable-next-line:jsx-no-lambda
            onInputChange={(value) => this.onSingleDigitInputChange(value, index)}
          />
        </View>
      )
    )

    return (
      <View>
        <Text style={styles.body}>
          {t('confirmAccountNumber.bodyPartial', {
            displayName,
          })}
        </Text>
        <Text style={styles.codeHeader}>{t('accountInputHeaderPartial')}</Text>
        <View style={styles.singleDigitInputContainer}>{singleDigitInputComponentArr}</View>
      </View>
    )
  }

  render = () => {
    const { t, recipient } = this.props
    const { displayName } = recipient

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps={'always'}
        >
          <View>
            <Text style={styles.h2}>{t('confirmAccountNumber.title')}</Text>
            <View>{this.renderInstructionsAndInputField()}</View>
          </View>
          <Text onPress={this.toggleModal} style={styles.askHelpText}>
            {t('confirmAccountNumber.help', { displayName })}
          </Text>
        </KeyboardAwareScrollView>
        <Button
          onPress={this.onPressConfirm}
          text={t('confirmAccount.button')}
          type={BtnTypes.PRIMARY}
          testID="ConfirmAccountButton"
        />
        <KeyboardSpacer />
        <Modal isVisible={this.state.isModalVisible}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>{t('helpModal.header')}</Text>
            <Text style={styles.body}>{t('helpModal.body1')}</Text>
            <Text style={styles.body}>{t('helpModal.body2')}</Text>
            <View style={styles.modalButtonsContainer}>
              <TextButton onPress={this.toggleModal} style={styles.modalCancelText}>
                {t('global:close')}
              </TextButton>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  singleDigitInputContainer: {
    flexDirection: 'row',
  },
  singleDigitInputWrapper: {
    paddingRight: 8,
  },
  codeHeader: {
    ...fontStyles.small600,
    paddingVertical: 8,
  },
  h2: {
    ...fontStyles.h2,
    paddingVertical: 16,
  },
  askHelpText: {
    ...fontStyles.small,
    marginTop: 20,
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
  body: {
    ...fontStyles.regular,
    paddingBottom: 16,
  },
  modalContainer: {
    backgroundColor: colors.background,
    margin: 24,
    borderRadius: 4,
  },
  modalHeader: {
    ...fontStyles.h2,
    marginVertical: 15,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  modalCancelText: {
    paddingRight: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, OwnProps, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withTranslation(Namespaces.sendFlow7)(ValidateRecipientAccount))
)

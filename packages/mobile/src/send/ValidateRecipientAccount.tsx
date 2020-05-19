import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'
import { SingleDigitInput } from 'src/components/SingleDigitInput'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { validateRecipientAddress } from 'src/identity/actions'
import { AddressValidationType } from 'src/identity/reducer'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'

const FULL_ADDRESS_PLACEHOLDER = '0xf1b1d5a6e7728g309c4a025k122d71ad75a61976'
const PARTIAL_ADDRESS_PLACEHOLDER = ['k', '0', 'F', '4']

interface StateProps {
  recipient: Recipient
  transactionData: TransactionDataInput
  addressValidationType: AddressValidationType
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

type OwnProps = StackScreenProps<StackParamList, Screens.ValidateRecipientAccount>
type Props = StateProps & DispatchProps & WithTranslation & OwnProps

const mapDispatchToProps = {
  validateRecipientAddress,
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { route } = ownProps
  const transactionData = route.params.transactionData
  const { recipient } = transactionData
  return {
    recipient,
    transactionData,
    isValidRecipient: state.identity.isValidRecipient,
    isPaymentRequest: route.params.isPaymentRequest,
    addressValidationType: route.params.addressValidationType,
  }
}

export class ValidateRecipientAccount extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('sendFlow7:confirmAccountNumber.title'),
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
    const { recipient, addressValidationType } = this.props
    const inputToValidate =
      addressValidationType === AddressValidationType.FULL
        ? inputValue
        : singleDigitInputValueArr.join('')
    this.props.validateRecipientAddress(inputToValidate, addressValidationType, recipient)
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
    const { t, recipient, addressValidationType } = this.props
    const { inputValue, singleDigitInputValueArr } = this.state
    const { displayName } = recipient

    if (addressValidationType === AddressValidationType.FULL) {
      return (
        <View>
          <Text style={styles.body}>
            {t('confirmAccountNumber.body1Full', {
              displayName,
            })}
          </Text>
          <Text style={styles.body}>
            {t('confirmAccountNumber.body2Full', {
              displayName,
            })}
          </Text>
          <Text style={styles.codeHeader}>{t('accountInputHeaderB')}</Text>
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
        <SingleDigitInput
          key={placeholderValue}
          inputValue={singleDigitInputValueArr[index]}
          inputPlaceholder={placeholderValue}
          // tslint:disable-next-line:jsx-no-lambda
          onInputChange={(value) => this.onSingleDigitInputChange(value, index)}
        />
      )
    )

    return (
      <View>
        <Text style={styles.body}>
          {t('confirmAccountNumber.body1Partial', {
            displayName,
          })}
        </Text>
        <Text style={styles.body}>
          {t('confirmAccountNumber.body2Partial', {
            displayName,
          })}
        </Text>
        <Text style={styles.codeHeader}>{t('accountInputHeaderA')}</Text>
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
          <View>{this.renderInstructionsAndInputField()}</View>
          <Text onPress={this.toggleModal} style={styles.askHelpText}>
            {t('confirmAccountNumber.help', { displayName })}
          </Text>
        </KeyboardAwareScrollView>
        <Button
          onPress={this.onPressConfirm}
          text={t('confirmAccount.button')}
          standard={false}
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
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    justifyContent: 'space-between',
  },
  singleDigitInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingRight: 10,
  },
  codeHeader: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    marginTop: 20,
    textAlign: 'center',
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
    flex: 1,
    justifyContent: 'center',
  },
  codeInputSpinner: {
    backgroundColor: '#FFF',
    position: 'absolute',
    top: 5,
    right: 3,
    padding: 10,
  },
  checkmarkContainer: {
    backgroundColor: colors.darkLightest,
    position: 'absolute',
    top: 3,
    right: 3,
    padding: 10,
  },
  askHelpText: {
    ...fontStyles.bodySmall,
    marginTop: 20,
    marginBottom: 10,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  body: {
    ...fontStyles.body,
    textAlign: 'center',
    paddingBottom: 15,
  },
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 4,
  },
  modalHeader: {
    ...fontStyles.h2,
    ...fontStyles.bold,
    marginVertical: 15,
  },
  modalButtonsContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  modalCancelText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    paddingRight: 20,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.sendFlow7)(ValidateRecipientAccount))

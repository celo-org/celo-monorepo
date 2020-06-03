import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { ErrorMessages } from 'src/app/ErrorMessages'
import AccountNumberCard from 'src/components/AccountNumberCard'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'
import ErrorMessageInline from 'src/components/ErrorMessageInline'
import Modal from 'src/components/Modal'
import { SingleDigitInput } from 'src/components/SingleDigitInput'
import { Namespaces, withTranslation } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon.v2'
import MenuBurgerCard from 'src/icons/MenuBurgerCard'
import { validateRecipientAddress } from 'src/identity/actions'
import { AddressValidationType } from 'src/identity/reducer'
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
  isPaymentRequest?: true
  error?: ErrorMessages | null
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
  const error = state.alert ? state.alert.underlyingError : null
  return {
    recipient,
    transactionData,
    isValidRecipient: state.identity.isValidRecipient,
    isPaymentRequest: route.params.isPaymentRequest,
    addressValidationType: route.params.addressValidationType,
    error,
  }
}

export class ValidateRecipientAccount extends React.Component<Props, State> {
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
        navigate(Screens.SendConfirmation, { transactionData, addressJustValidated: true })
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
            {displayName === 'Mobile #'
              ? t('confirmAccountNumber.body1FullNoDisplayName')
              : t('confirmAccountNumber.body1Full', { displayName })}
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
          {displayName === 'Mobile #'
            ? t('confirmAccountNumber.bodyPartialNoDisplayName')
            : t('confirmAccountNumber.bodyPartial', { displayName })}
        </Text>
        <Text style={styles.codeHeader}>{t('accountInputHeaderPartial')}</Text>
        <View style={styles.singleDigitInputContainer}>{singleDigitInputComponentArr}</View>
      </View>
    )
  }

  render = () => {
    const { t, recipient, error } = this.props
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
            <ErrorMessageInline error={error} />
            <Button
              style={styles.button}
              onPress={this.onPressConfirm}
              text={t('confirmAccountNumber.submit')}
              type={BtnTypes.PRIMARY}
              testID="ConfirmAccountButton"
            />
          </View>
          <View style={styles.helpContainer}>
            <InfoIcon />
            <Text onPress={this.toggleModal} style={styles.askHelpText}>
              {t('confirmAccountNumber.help', { displayName })}
            </Text>
          </View>
        </KeyboardAwareScrollView>
        <KeyboardSpacer />
        <Modal isVisible={this.state.isModalVisible}>
          <Text style={styles.modalHeader}>{t('helpModal.header')}</Text>
          <Text style={styles.modalBody}>{t('helpModal.body1')}</Text>
          <View style={styles.menuContainer}>
            <View style={styles.menuCardContainer}>
              <MenuBurgerCard length={30} />
            </View>
            <Text style={styles.menuText}>Menu</Text>
          </View>
          <Text style={styles.modalBody}>{t('helpModal.body2')}</Text>
          <View style={styles.addressContainer}>
            <AccountNumberCard address={FULL_ADDRESS_PLACEHOLDER} />
            <Text style={styles.modalBody2}>{t('helpModal.body3')}</Text>
          </View>
          <View style={styles.modalButtonContainer}>
            <TextButton onPress={this.toggleModal}>{t('global:dismiss')}</TextButton>
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
  button: {
    paddingVertical: 16,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  askHelpText: {
    ...fontStyles.small,
    paddingLeft: 8,
    textDecorationLine: 'underline',
  },
  body: {
    ...fontStyles.regular,
    paddingBottom: 16,
  },
  modalBody: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingVertical: 8,
  },
  modalHeader: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingBottom: 4,
  },
  modalBody2: {
    ...fontStyles.small,
    textAlign: 'center',
    color: colors.gray4,
    paddingVertical: 16,
    paddingTop: 16,
  },
  menuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  menuCardContainer: {
    paddingHorizontal: 8,
  },
  menuText: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingHorizontal: 8,
  },
  addressContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonContainer: {
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.sendFlow7)(ValidateRecipientAccount))

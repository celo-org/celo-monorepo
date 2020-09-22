import ContactCircle from '@celo/react-components/components/ContactCircle'
import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { showError } from 'src/alert/actions'
import { RequestEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton.v2'
import CommentTextInput from 'src/components/CommentTextInput'
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import TotalLineItem from 'src/components/TotalLineItem.v2'
import { currencyToShortMap } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers.v2'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { writePaymentRequest } from 'src/paymentRequest/actions'
import { PaymentRequestStatus } from 'src/paymentRequest/types'
import { getDisplayName, getRecipientThumbnail } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { ConfirmationInput, getConfirmationInput } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

// @ts-ignore
const TAG = 'paymentRequest/confirmation'

interface StateProps {
  e164PhoneNumber: string | null
  account: string | null
  confirmationInput: ConfirmationInput
  addressJustValidated?: boolean
}

interface DispatchProps {
  showError: typeof showError
  writePaymentRequest: typeof writePaymentRequest
}

const mapDispatchToProps = { showError, writePaymentRequest }

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { route } = ownProps
  const { transactionData, addressJustValidated } = route.params
  const { e164NumberToAddress } = state.identity
  const { secureSendPhoneNumberMapping } = state.identity
  const confirmationInput = getConfirmationInput(
    transactionData,
    e164NumberToAddress,
    secureSendPhoneNumberMapping
  )
  return {
    confirmationInput,
    e164PhoneNumber: state.account.e164PhoneNumber,
    account: currentAccountSelector(state),
    addressJustValidated,
  }
}

type OwnProps = StackScreenProps<StackParamList, Screens.PaymentRequestConfirmation>

type Props = DispatchProps & StateProps & WithTranslation & OwnProps

export const paymentConfirmationScreenNavOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton eventName={RequestEvents.request_confirm_back} />,
})

class PaymentRequestConfirmation extends React.Component<Props> {
  state = {
    comment: '',
  }

  componentDidMount() {
    const { addressJustValidated, t } = this.props
    if (addressJustValidated) {
      Logger.showMessage(t('sendFlow7:addressConfirmed'))
    }
  }

  onCommentChange = (comment: string) => {
    this.setState({ comment })
  }

  onBlur = () => {
    const comment = this.state.comment.trim()
    this.setState({ comment })
  }

  onConfirm = async () => {
    const { amount, recipient, recipientAddress: requesteeAddress } = this.props.confirmationInput
    const { t } = this.props
    if (!recipient || (!recipient.e164PhoneNumber && !recipient.address)) {
      throw new Error("Can't request from recipient without valid e164 number or a wallet address")
    }

    const address = this.props.account
    if (!address) {
      throw new Error("Can't request without a valid account")
    }

    if (!requesteeAddress) {
      throw new Error('Error passing through the requestee address')
    }

    const paymentInfo = {
      amount: amount.toString(),
      comment: this.state.comment || undefined,
      timestamp: new Date(),
      requesterAddress: address,
      requesterE164Number: this.props.e164PhoneNumber ?? undefined,
      requesteeAddress: requesteeAddress.toLowerCase(),
      currency: currencyToShortMap[CURRENCY_ENUM.DOLLAR],
      status: PaymentRequestStatus.REQUESTED,
      notified: false,
    }

    ValoraAnalytics.track(RequestEvents.request_confirm_request, { requesteeAddress })
    this.props.writePaymentRequest(paymentInfo)
    Logger.showMessage(t('requestSent'))
  }

  renderFooter = () => {
    const amount = {
      value: this.props.confirmationInput.amount,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code, // Only cUSD for now
    }

    return (
      <View style={styles.feeContainer}>
        <TotalLineItem amount={amount} />
      </View>
    )
  }

  render() {
    const { t, confirmationInput } = this.props
    const { recipient, recipientAddress: requesteeAddress } = confirmationInput
    const amount = {
      value: this.props.confirmationInput.amount,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code, // Only cUSD for now
    }

    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <DisconnectBanner />
        <ReviewFrame
          FooterComponent={this.renderFooter}
          confirmButton={{
            action: this.onConfirm,
            text: t('request'),
            disabled: false,
          }}
        >
          <View style={styles.transferContainer}>
            <View style={styles.headerContainer}>
              <ContactCircle
                name={this.props.confirmationInput.recipient.displayName}
                thumbnailPath={getRecipientThumbnail(recipient)}
                address={requesteeAddress || ''}
              />
              <View style={styles.recipientInfoContainer}>
                <Text style={styles.headerText}>{t('requesting')}</Text>
                <Text style={styles.displayName}>
                  {getDisplayName({ recipient, recipientAddress: requesteeAddress, t })}
                </Text>
              </View>
            </View>
            <CurrencyDisplay type={DisplayType.Default} style={styles.amount} amount={amount} />
            <CommentTextInput
              testID={'request'}
              onCommentChange={this.onCommentChange}
              comment={this.state.comment}
              onBlur={this.onBlur}
            />
          </View>
        </ReviewFrame>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  feeContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  transferContainer: {
    alignItems: 'flex-start',
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipientInfoContainer: {
    paddingLeft: 8,
  },
  headerText: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
  displayName: {
    ...fontStyles.regular500,
  },
  amount: {
    paddingVertical: 8,
    ...fontStyles.largeNumber,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.paymentRequestFlow)(PaymentRequestConfirmation))

import Button, { BtnTypes } from '@celo/react-components/components/Button'
import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import SMSLogo from 'src/icons/InviteSendReceive'
import WhatsAppLogo from 'src/icons/WhatsAppLogo'
import { isPhoneNumberVerified } from 'src/identity/verification'
import { InviteBy, sendInvite } from 'src/invite/actions'
import { getInvitationVerificationFeeInDollars } from 'src/invite/saga'
import { navigateBack } from 'src/navigator/NavigationService'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import TransferReviewCard from 'src/send/TransferReviewCard'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { TransactionTypes } from 'src/transactions/reducer'

interface State {
  contactIsVerified: boolean
  amountIsValid: boolean
}

type Props = StateProps & DispatchProps & NavigationInjectedProps & WithNamespaces

interface StateProps {
  inviteInProgress: boolean
  dollarBalance: string
  defaultCountryCode: string
}

interface DispatchProps {
  fetchDollarBalance: typeof fetchDollarBalance
  sendInvite: typeof sendInvite
  showError: typeof showError
  hideAlert: typeof hideAlert
}

const mapStateToProps = (state: RootState): StateProps => ({
  inviteInProgress: state.invite.isSendingInvite,
  dollarBalance: state.stableToken.balance || '0',
  defaultCountryCode: state.account.defaultCountryCode,
})

const mapDispatchToProps = {
  sendInvite,
  fetchDollarBalance,
  amountIsValid: false,
  showError,
  hideAlert,
}

// TODO remove duplication between this screen and SendAmount/SendConfirmation
export class InviteReview extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state: State = {
    contactIsVerified: false,
    amountIsValid: false,
  }

  componentDidMount() {
    this.props.fetchDollarBalance()
    this.checkIfPhoneNumberIsVerified()
    this.checkIfEnoughFundsAreAvailable()
  }

  getRecipient = (): Recipient => {
    const recipient = this.props.navigation.getParam('recipient')
    if (!recipient) {
      throw new Error('Recipient expected')
    }
    return recipient
  }

  checkIfPhoneNumberIsVerified = async () => {
    const recipient = this.getRecipient()
    const isVerified = await isPhoneNumberVerified(recipient.e164PhoneNumber)
    this.setState({
      contactIsVerified: isVerified,
    })
  }

  checkIfEnoughFundsAreAvailable = () => {
    const amountIsValid = new BigNumber(this.props.dollarBalance).isGreaterThan(
      getInvitationVerificationFeeInDollars()
    )
    this.setState({ amountIsValid })
  }

  onInviteSMS = async () => {
    CeloAnalytics.track(CustomEventNames.invite_friends_sms)
    await this.onInvite(InviteBy.SMS)
  }

  onInviteWhatsApp = async () => {
    CeloAnalytics.track(CustomEventNames.invite_friends_whatsapp)
    await this.onInvite(InviteBy.WhatsApp)
  }

  onInvite = async (inviteMode: InviteBy) => {
    this.props.hideAlert()

    if (!this.state.amountIsValid) {
      this.props.showError(this.props.t('needMoreFundsToInvite'))
      return
    }

    const recipient = this.getRecipient()

    if (!recipient || !recipient.e164PhoneNumber) {
      throw new Error("Can't send to recipient without valid e164 number")
    }

    this.props.sendInvite(recipient.displayName, recipient.e164PhoneNumber, inviteMode)
  }

  onEdit = () => {
    CeloAnalytics.track(CustomEventNames.invite_edit)
    navigateBack()
  }

  renderHeader = () => {
    return <ReviewHeader title={this.props.t('reviewInvite')} />
  }

  renderFooter = () => {
    const { t, inviteInProgress } = this.props
    return (
      <View>
        <GethAwareButton
          onPress={this.onInviteSMS}
          text={t('inviteWithSMS')}
          accessibilityLabel={t('inviteWithSMS')}
          standard={false}
          type={BtnTypes.TERTIARY}
          disabled={inviteInProgress}
        >
          <SMSLogo />
        </GethAwareButton>
        <GethAwareButton
          testID={'inviteWhatsApp'}
          onPress={this.onInviteWhatsApp}
          text={t('inviteWithWhatsapp')}
          accessibilityLabel={t('inviteWithWhatsapp')}
          standard={false}
          type={BtnTypes.TERTIARY}
          disabled={inviteInProgress}
        >
          <WhatsAppLogo />
        </GethAwareButton>
        <Button
          onPress={this.onEdit}
          text={t('cancel')}
          accessibilityLabel={t('cancel')}
          standard={false}
          type={BtnTypes.SECONDARY}
          disabled={inviteInProgress}
        />
        {inviteInProgress && (
          <View style={style.loadingIcon}>
            <ActivityIndicator size="large" color={colors.celoGreen} />
          </View>
        )}
      </View>
    )
  }

  render() {
    const recipient = this.getRecipient()
    return (
      <ReviewFrame HeaderComponent={this.renderHeader} FooterComponent={this.renderFooter}>
        <TransferReviewCard
          recipient={recipient}
          type={TransactionTypes.INVITE_SENT}
          address={recipient.address}
          value={getInvitationVerificationFeeInDollars()}
          e164PhoneNumber={recipient.e164PhoneNumber}
          currency={CURRENCY_ENUM.DOLLAR}
          fee={new BigNumber(0)}
        />
      </ReviewFrame>
    )
  }
}

const style = StyleSheet.create({
  loadingIcon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.inviteFlow11)(InviteReview))
)

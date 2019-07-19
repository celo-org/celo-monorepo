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
import { ERROR_BANNER_DURATION } from 'src/config'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import SMSLogo from 'src/icons/InviteSendReceive'
import WhatsAppLogo from 'src/icons/WhatsAppLogo'
import { isPhoneNumberVerified } from 'src/identity/verification'
import { InviteBy, sendInvite } from 'src/invite/actions'
import { navigateBack } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import TransferConfirmationCard from 'src/send/TransferConfirmationCard'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { TransactionTypes } from 'src/transactions/reducer'
import { Recipient } from 'src/utils/recipient'

interface State {
  contactIsVerified: boolean
  amountIsValid: boolean
}

type Props = StateProps & DispatchProps & NavigationInjectedProps & WithNamespaces

interface StateProps {
  inviteInProgress: boolean
  dollarBalance: string | null
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
  dollarBalance: state.stableToken.balance,
  defaultCountryCode: state.account.defaultCountryCode,
})

const mapDispatchToProps = {
  sendInvite,
  fetchDollarBalance,
  amountIsValid: false,
  showError,
  hideAlert,
}

// TODO: this will eventually be dynamic, but for the pilot is harcoded.
const staticInviteFeeAmount = 0.3

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
    const currentBalance = this.props.dollarBalance ? parseFloat(this.props.dollarBalance) : 0
    const amountIsValid = staticInviteFeeAmount <= currentBalance
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
      this.props.showError(this.props.t('needMoreFundsToInvite'), ERROR_BANNER_DURATION)
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
        <TransferConfirmationCard
          type={TransactionTypes.INVITE_SENT}
          address={recipient.address}
          value={new BigNumber(staticInviteFeeAmount)}
          e164PhoneNumber={recipient.e164PhoneNumber}
          currency={CURRENCY_ENUM.DOLLAR}
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

import Button, { BtnTypes } from '@celo/react-components/components/Button'
import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { TokenTransactionType } from 'src/apollo/types'
import { FeeType } from 'src/fees/actions'
import CalculateFee from 'src/fees/CalculateFee'
import { getFeeDollars } from 'src/fees/selectors'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces, withTranslation } from 'src/i18n'
import SMSLogo from 'src/icons/InviteSendReceive'
import WhatsAppLogo from 'src/icons/WhatsAppLogo'
import { InviteBy, sendInvite } from 'src/invite/actions'
import { getInvitationVerificationFeeInDollars } from 'src/invite/saga'
import { navigateBack } from 'src/navigator/NavigationService'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import TransferReviewCard from 'src/send/TransferReviewCard'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { currentAccountSelector } from 'src/web3/selectors'

interface State {
  amountIsValid: boolean
}

type Props = StateProps & DispatchProps & NavigationInjectedProps & WithTranslation

interface StateProps {
  account: string | null
  inviteInProgress: boolean
  dollarBalance: string
}

interface DispatchProps {
  fetchDollarBalance: typeof fetchDollarBalance
  sendInvite: typeof sendInvite
  showError: typeof showError
  hideAlert: typeof hideAlert
}

const mapStateToProps = (state: RootState): StateProps => ({
  account: currentAccountSelector(state),
  inviteInProgress: state.invite.isSendingInvite,
  dollarBalance: state.stableToken.balance || '0',
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
    amountIsValid: false,
  }

  componentDidMount() {
    this.props.fetchDollarBalance()
    this.checkIfEnoughFundsAreAvailable()
  }

  getRecipient = (): Recipient => {
    const recipient = this.props.navigation.getParam('recipient')
    if (!recipient) {
      throw new Error('Recipient expected')
    }
    return recipient
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

    this.props.sendInvite(recipient.e164PhoneNumber, inviteMode)
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
    const { account } = this.props
    if (!account) {
      throw Error('Account is required')
    }

    const recipient = this.getRecipient()
    const amount = getInvitationVerificationFeeInDollars()

    return (
      <SafeAreaView style={style.container}>
        <ReviewFrame HeaderComponent={this.renderHeader} FooterComponent={this.renderFooter}>
          <CalculateFee feeType={FeeType.INVITE} account={account} amount={amount} comment="">
            {(asyncFee) => (
              <TransferReviewCard
                recipient={recipient}
                type={TokenTransactionType.InviteSent}
                address={recipient.address}
                // It's only an invite without additional funds
                value={new BigNumber(0)}
                e164PhoneNumber={recipient.e164PhoneNumber}
                currency={CURRENCY_ENUM.DOLLAR}
                fee={getFeeDollars(asyncFee.result)}
                isLoadingFee={asyncFee.loading}
                feeError={asyncFee.error}
              />
            )}
          </CalculateFee>
        </ReviewFrame>
      </SafeAreaView>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  )(withTranslation(Namespaces.inviteFlow11)(InviteReview))
)

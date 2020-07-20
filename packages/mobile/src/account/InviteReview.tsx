import Button, { BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay'
import { SecurityFeeIcon } from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow.v2'
import TotalLineItem from 'src/components/TotalLineItem.v2'
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
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { currentAccountSelector } from 'src/web3/selectors'

interface State {
  amountIsValid: boolean
}

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

type OwnProps = StackScreenProps<StackParamList, Screens.InviteReview>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

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

  getRecipient = () => {
    const recipient = this.props.route.params.recipient
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
    await this.onInvite(InviteBy.SMS)
  }

  onInviteWhatsApp = async () => {
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
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="large" color={colors.celoGreen} />
          </View>
        )}
      </View>
    )
  }

  render() {
    const { account, t } = this.props
    if (!account) {
      throw Error('Account is required')
    }

    const recipient = this.getRecipient()
    const inviteFee = getInvitationVerificationFeeInDollars()

    const inviteFeeAmount = {
      value: inviteFee,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }

    return (
      <SafeAreaView style={styles.container}>
        <ReviewFrame HeaderComponent={this.renderHeader} FooterComponent={this.renderFooter}>
          <CalculateFee
            feeType={FeeType.INVITE}
            account={account}
            amount={new BigNumber(0)}
            comment=""
          >
            {(asyncFee) => {
              const fee = getFeeDollars(asyncFee.result)
              const securityFee = fee ? fee.minus(inviteFee) : fee
              const securityFeeAmount = securityFee && {
                value: securityFee,
                currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
              }

              const totalAmount = {
                value: fee || 0,
                currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
              }

              return (
                <View>
                  <Avatar
                    recipient={recipient}
                    address={recipient.address}
                    e164Number={recipient.e164PhoneNumber}
                  />
                  <CurrencyDisplay
                    type={DisplayType.Big}
                    style={styles.amount}
                    amount={inviteFeeAmount}
                  />
                  <View style={styles.bottomContainer}>
                    <HorizontalLine />
                    <LineItemRow
                      title={t('inviteFee')}
                      amount={<CurrencyDisplay amount={inviteFeeAmount} />}
                    />
                    <LineItemRow
                      title={t('sendFlow7:securityFee')}
                      titleIcon={<SecurityFeeIcon />}
                      amount={
                        securityFeeAmount && (
                          <CurrencyDisplay amount={securityFeeAmount} formatType={FormatType.Fee} />
                        )
                      }
                      isLoading={asyncFee.loading}
                      hasError={!!asyncFee.error}
                    />
                    <HorizontalLine />
                    <TotalLineItem amount={totalAmount} />
                  </View>
                </View>
              )
            }}
          </CalculateFee>
        </ReviewFrame>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: 25,
  },
  editContainer: {
    flexDirection: 'row',
  },
  bottomContainer: {
    marginTop: 5,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  amount: {
    marginTop: 15,
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

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.inviteFlow11)(InviteReview))

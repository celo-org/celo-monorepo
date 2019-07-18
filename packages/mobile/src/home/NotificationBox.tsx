import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { NativeScrollEvent, ScrollView, StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import { dismissEarnRewards, dismissInviteFriends, PaymentRequest } from 'src/account'
import { getPaymentRequests } from 'src/account/selectors'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { PROMOTE_REWARDS_APP } from 'src/config'
import { EscrowedPayment } from 'src/escrow/actions'
import { setEducationCompleted as setGoldEducationCompleted } from 'src/goldToken/actions'
import i18n, { Namespaces } from 'src/i18n'
import { backupIcon, homeIcon, inviteFriendsIcon, rewardsAppIcon } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import EscrowedPaymentReminderNotification from 'src/notifications/EscrowedPaymentReminderNotification'
import PaymentRequestSummaryNotification from 'src/notifications/PaymentRequestSummaryNotification'
import SimpleNotification from 'src/notifications/SimpleNotification'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'
import { navigateToVerifierApp } from 'src/utils/linking'

interface StateProps {
  backupCompleted: boolean
  goldEducationCompleted: boolean
  dismissedEarnRewards: boolean
  dismissedInviteFriends: boolean
  paymentRequests: PaymentRequest[]
  backupTooLate: boolean
  sentPayments: EscrowedPayment[]
}

interface DispatchProps {
  dismissEarnRewards: typeof dismissEarnRewards
  dismissInviteFriends: typeof dismissInviteFriends
  setGoldEducationCompleted: typeof setGoldEducationCompleted
}

type Props = DispatchProps & StateProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => ({
  backupCompleted: state.account.backupCompleted,
  goldEducationCompleted: state.goldToken.educationCompleted,
  paymentRequests: getPaymentRequests(state),
  dismissedEarnRewards: state.account.dismissedEarnRewards,
  dismissedInviteFriends: state.account.dismissedInviteFriends,
  backupTooLate: isBackupTooLate(state),
  sentPayments: state.escrow.sentEscrowedPayments,
})

const mapDispatchToProps = {
  dismissEarnRewards,
  dismissInviteFriends,
  setGoldEducationCompleted,
}

interface State {
  currentIndex: number
}

export class NotificationBox extends React.Component<Props, State> {
  state = {
    currentIndex: 0,
  }

  escrowedPaymentReminderNotification = (): Array<React.ReactElement<any>> => {
    const activeSentPayments = this.filterValidPayments()
    const activeSentPaymentNotifications: Array<React.ReactElement<any>> = activeSentPayments.map(
      (payment, i) => (
        <EscrowedPaymentReminderNotification key={payment.paymentID} payment={payment} />
      )
    )
    return activeSentPaymentNotifications
  }

  filterValidPayments = (): EscrowedPayment[] => {
    const { sentPayments } = this.props
    const validSentPayments: EscrowedPayment[] = []
    sentPayments.forEach((payment) => {
      const paymentExpiryTime = +payment.timestamp + +payment.expirySeconds
      const currUnixTime = Date.now()
      if (currUnixTime >= paymentExpiryTime) {
        validSentPayments.push(payment)
      }
    })
    return validSentPayments
  }

  paymentRequestsNotification = (): Array<React.ReactElement<any>> => {
    const { paymentRequests } = this.props
    if (paymentRequests && paymentRequests.length) {
      return [<PaymentRequestSummaryNotification key={1} requests={paymentRequests} />]
    }
    return []
  }

  generalNotifications = (): Array<React.ReactElement<any>> => {
    const {
      t,
      backupCompleted,
      goldEducationCompleted,
      dismissedEarnRewards,
      dismissedInviteFriends,
    } = this.props
    const actions = []

    if (!backupCompleted) {
      actions.push({
        title: t('getBackupKey'),
        text: t('setBackupKey'),
        image: backupIcon,
        ctaList: [
          {
            text: t('getBackupKey'),
            onPress: () => {
              CeloAnalytics.track(CustomEventNames.get_backup_key)
              navigate(Screens.Backup)
            },
          },
        ],
      })
    }

    if (!dismissedEarnRewards && PROMOTE_REWARDS_APP) {
      actions.push({
        title: i18n.t('walletFlow5:earnCeloRewards'),
        text: i18n.t('walletFlow5:earnCeloGold'),
        image: rewardsAppIcon,
        ctaList: [
          {
            text: i18n.t('walletFlow5:startEarning'),
            onPress: () => {
              this.props.dismissEarnRewards()
              CeloAnalytics.track(CustomEventNames.celorewards_notification_confirm)
              navigateToVerifierApp()
            },
          },
          {
            text: t('maybeLater'),
            onPress: () => {
              this.props.dismissEarnRewards()
              CeloAnalytics.track(CustomEventNames.celorewards_notification_dismiss)
            },
          },
        ],
      })
    }

    if (!goldEducationCompleted) {
      actions.push({
        title: t('celoGold'),
        text: i18n.t('exchangeFlow9:whatIsGold'),
        image: homeIcon,
        ctaList: [
          {
            text: t('exchange'),
            onPress: () => {
              this.props.setGoldEducationCompleted()
              CeloAnalytics.track(CustomEventNames.celogold_notification_confirm)
              navigate(Screens.ExchangeHomeScreen)
            },
          },
          {
            text: t('maybeLater'),
            onPress: () => {
              this.props.setGoldEducationCompleted()
              CeloAnalytics.track(CustomEventNames.celogold_notification_dismiss)
            },
          },
        ],
      })
    }

    if (!dismissedInviteFriends) {
      actions.push({
        title: i18n.t('inviteFlow11:inviteFriendsToCelo'),
        text: i18n.t('inviteFlow11:inviteAnyone'),
        image: inviteFriendsIcon,
        ctaList: [
          {
            text: i18n.t('global:inviteFriends'),
            onPress: () => {
              this.props.dismissInviteFriends()
              CeloAnalytics.track(CustomEventNames.invitefriends_notification_confirm)
              navigate(Screens.Invite)
            },
          },
          {
            text: t('maybeLater'),
            onPress: () => {
              this.props.dismissInviteFriends()
              CeloAnalytics.track(CustomEventNames.invitefriends_notification_dismiss)
            },
          },
        ],
      })
    }

    return actions.map((notification, i) => <SimpleNotification key={i} {...notification} />)
  }

  paginationDots = (notifications: Array<React.ReactElement<any>>) => {
    if (notifications.length < 2) {
      return null
    }
    return (
      <View style={styles.pagination}>
        {notifications.map((n, i) => {
          return (
            <View
              key={i}
              style={this.state.currentIndex === i ? activeDotStyle : passiveDotStyle}
            />
          )
        })}
      </View>
    )
  }

  handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    this.setState({
      currentIndex: Math.round(event.nativeEvent.contentOffset.x / variables.width),
    })
  }

  render() {
    const notifications = [...this.paymentRequestsNotification(), ...this.generalNotifications()]

    if (!notifications || !notifications.length) {
      // No notifications, no slider
      return null
    }
    return (
      <View style={styles.body}>
        <ScrollView
          horizontal={true}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          // @ts-ignore TODO(cmcewen): should be fixed with new RN types
          onScroll={this.handleScroll}
        >
          {notifications.map((notification, i) => (
            <View key={i} style={styles.notificationContainer}>
              {notification}
            </View>
          ))}
        </ScrollView>
        {this.paginationDots(notifications)}
      </View>
    )
  }
}

const PROGRESS_CIRCLE_PASSIVE_SIZE = 6
const PROGRESS_CIRCLE_ACTIVE_SIZE = 8

const styles = StyleSheet.create({
  body: {
    maxWidth: variables.width,
    width: variables.width,
  },
  notificationContainer: {
    width: variables.width - 2 * variables.contentPadding,
    margin: variables.contentPadding,
  },
  pagination: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: variables.contentPadding,
    alignItems: 'center',
  },
  circle: {
    flex: 0,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  circlePassive: {
    backgroundColor: colors.inactive,
    height: PROGRESS_CIRCLE_PASSIVE_SIZE,
    width: PROGRESS_CIRCLE_PASSIVE_SIZE,
  },
  circleActive: {
    backgroundColor: colors.celoGreen,
    height: PROGRESS_CIRCLE_ACTIVE_SIZE,
    width: PROGRESS_CIRCLE_ACTIVE_SIZE,
  },
})

const activeDotStyle = StyleSheet.flatten([styles.circle, styles.circleActive])
const passiveDotStyle = StyleSheet.flatten([styles.circle, styles.circlePassive])

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.walletFlow5)(NotificationBox))
)

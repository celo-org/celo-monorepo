import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import { dismissEarnRewards, dismissGetVerified, dismissInviteFriends } from 'src/account/actions'
import { getIncomingPaymentRequests, getOutgoingPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { PROMOTE_REWARDS_APP } from 'src/config'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentReminderSummaryNotification from 'src/escrow/EscrowedPaymentReminderSummaryNotification'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import { setEducationCompleted as setGoldEducationCompleted } from 'src/goldToken/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import BackupKeyIcon from 'src/icons/BackupKeyIcon'
import { getVerifiedIcon, homeIcon, inviteFriendsIcon, rewardsAppIcon } from 'src/images/Images'
import { InviteDetails } from 'src/invite/actions'
import { inviteesSelector } from 'src/invite/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SimpleNotification from 'src/notifications/SimpleNotification'
import IncomingPaymentRequestSummaryNotification from 'src/paymentRequest/IncomingPaymentRequestSummaryNotification'
import OutgoingPaymentRequestSummaryNotification from 'src/paymentRequest/OutgoingPaymentRequestSummaryNotification'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'
import { navigateToVerifierApp } from 'src/utils/linking'

interface StateProps {
  backupCompleted: boolean
  numberVerified: boolean
  goldEducationCompleted: boolean
  dismissedEarnRewards: boolean
  dismissedInviteFriends: boolean
  dismissedGetVerified: boolean
  incomingPaymentRequests: PaymentRequest[]
  outgoingPaymentRequests: PaymentRequest[]
  backupTooLate: boolean
  reclaimableEscrowPayments: EscrowedPayment[]
  invitees: InviteDetails[]
}

interface DispatchProps {
  dismissEarnRewards: typeof dismissEarnRewards
  dismissInviteFriends: typeof dismissInviteFriends
  dismissGetVerified: typeof dismissGetVerified
  setGoldEducationCompleted: typeof setGoldEducationCompleted
}

type Props = DispatchProps & StateProps & WithTranslation

const mapStateToProps = (state: RootState): StateProps => ({
  backupCompleted: state.account.backupCompleted,
  numberVerified: state.app.numberVerified,
  goldEducationCompleted: state.goldToken.educationCompleted,
  incomingPaymentRequests: getIncomingPaymentRequests(state),
  outgoingPaymentRequests: getOutgoingPaymentRequests(state),
  dismissedEarnRewards: state.account.dismissedEarnRewards,
  dismissedInviteFriends: state.account.dismissedInviteFriends,
  dismissedGetVerified: state.account.dismissedGetVerified,
  backupTooLate: isBackupTooLate(state),
  reclaimableEscrowPayments: getReclaimableEscrowPayments(state),
  invitees: inviteesSelector(state),
})

const mapDispatchToProps = {
  dismissEarnRewards,
  dismissInviteFriends,
  dismissGetVerified,
  setGoldEducationCompleted,
}

interface State {
  currentIndex: number
}

export class NotificationBox extends React.Component<Props, State> {
  state = {
    currentIndex: 0,
  }

  escrowedPaymentReminderNotification = () => {
    const { reclaimableEscrowPayments, invitees } = this.props
    if (reclaimableEscrowPayments && reclaimableEscrowPayments.length) {
      return [
        <EscrowedPaymentReminderSummaryNotification
          key={1}
          payments={reclaimableEscrowPayments}
          invitees={invitees}
        />,
      ]
    }
    return []
  }

  incomingPaymentRequestsNotification = (): Array<React.ReactElement<any>> => {
    const { incomingPaymentRequests } = this.props
    if (incomingPaymentRequests && incomingPaymentRequests.length) {
      return [
        <IncomingPaymentRequestSummaryNotification key={1} requests={incomingPaymentRequests} />,
      ]
    }
    return []
  }

  outgoingPaymentRequestsNotification = (): Array<React.ReactElement<any>> => {
    const { outgoingPaymentRequests } = this.props
    if (outgoingPaymentRequests && outgoingPaymentRequests.length) {
      return [
        <OutgoingPaymentRequestSummaryNotification key={1} requests={outgoingPaymentRequests} />,
      ]
    }
    return []
  }

  generalNotifications = (): Array<React.ReactElement<any>> => {
    const {
      t,
      backupCompleted,
      numberVerified,
      goldEducationCompleted,
      dismissedEarnRewards,
      dismissedInviteFriends,
      dismissedGetVerified,
    } = this.props
    const actions = []

    if (!backupCompleted) {
      actions.push({
        title: t('backupKeyFlow6:yourBackupKey'),
        text: t('backupKeyFlow6:backupKeyNotification'),
        image: <BackupKeyIcon height={40} width={40} />,
        ctaList: [
          {
            text: t('backupKeyFlow6:getBackupKey'),
            onPress: () => {
              CeloAnalytics.track(CustomEventNames.get_backup_key)
              navigate(Screens.BackupIntroduction)
            },
          },
        ],
      })
    }

    if (!dismissedGetVerified && !numberVerified) {
      actions.push({
        title: t('nuxVerification2:notification.title'),
        text: t('nuxVerification2:notification.body'),
        image: getVerifiedIcon,
        ctaList: [
          {
            text: t('nuxVerification2:notification.cta'),
            onPress: () => {
              navigate(Screens.VerificationEducationScreen)
            },
          },
          {
            text: t('maybeLater'),
            onPress: () => {
              this.props.dismissGetVerified()
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
        title: t('global:celoGold'),
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
              style={this.state.currentIndex === i ? styles.circleActive : styles.circlePassive}
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
    const notifications = [
      ...this.incomingPaymentRequestsNotification(),
      ...this.outgoingPaymentRequestsNotification(),
      ...this.escrowedPaymentReminderNotification(),
      ...this.generalNotifications(),
    ]

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

const circle = {
  flex: 0,
  borderRadius: 8,
  marginHorizontal: 5,
}

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
  circle,
  circlePassive: {
    ...circle,
    backgroundColor: colors.inactive,
    height: PROGRESS_CIRCLE_PASSIVE_SIZE,
    width: PROGRESS_CIRCLE_PASSIVE_SIZE,
  },
  circleActive: {
    ...circle,
    backgroundColor: colors.celoGreen,
    height: PROGRESS_CIRCLE_ACTIVE_SIZE,
    width: PROGRESS_CIRCLE_ACTIVE_SIZE,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withTranslation(Namespaces.walletFlow5)(NotificationBox))
)

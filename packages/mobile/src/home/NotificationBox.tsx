import Pagination from '@celo/react-components/components/Pagination'
import SimpleMessagingCard, {
  Props as SimpleMessagingCardProps,
} from '@celo/react-components/components/SimpleMessagingCard'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import { dismissGetVerified, dismissGoldEducation, dismissInviteFriends } from 'src/account/actions'
import { HomeEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openUrl as openUrlAction } from 'src/app/actions'
import { verificationPossibleSelector } from 'src/app/selectors'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentReminderSummaryNotification from 'src/escrow/EscrowedPaymentReminderSummaryNotification'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import { pausedFeatures } from 'src/flags'
import { dismissNotification } from 'src/home/actions'
import { IdToNotification } from 'src/home/reducers'
import { getExtraNotifications } from 'src/home/selectors'
import { Namespaces, withTranslation } from 'src/i18n'
import { backupKey, getVerified, inviteFriends, learnCelo } from 'src/images/Images'
import { InviteDetails } from 'src/invite/actions'
import { inviteesSelector } from 'src/invite/reducer'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import IncomingPaymentRequestSummaryNotification from 'src/paymentRequest/IncomingPaymentRequestSummaryNotification'
import OutgoingPaymentRequestSummaryNotification from 'src/paymentRequest/OutgoingPaymentRequestSummaryNotification'
import {
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
} from 'src/paymentRequest/selectors'
import { PaymentRequest } from 'src/paymentRequest/types'
import { RootState } from 'src/redux/reducers'
import { getContentForCurrentLang } from 'src/utils/contentTranslations'
import Logger from 'src/utils/Logger'

const TAG = 'NotificationBox'

export enum NotificationBannerTypes {
  incoming_tx_request = 'incoming_tx_request',
  outgoing_tx_request = 'outgoing_tx_request',
  escrow_tx_summary = 'escrow_tx_summary',
  escrow_tx_pending = 'escrow_tx_pending',
  celo_asset_education = 'celo_asset_education',
  invite_prompt = 'invite_prompt',
  verification_prompt = 'verification_prompt',
  backup_prompt = 'backup_prompt',
  remote_notification = 'remote_notification',
}

export enum NotificationBannerCTATypes {
  accept = 'accept',
  decline = 'decline',
  review = 'review',
  reclaim = 'reclaim',
  remind = 'remind',
  pay = 'pay',
  remote_notification_cta = 'remote_notification_cta',
}

interface StateProps {
  backupCompleted: boolean
  numberVerified: boolean
  goldEducationCompleted: boolean
  dismissedInviteFriends: boolean
  dismissedGetVerified: boolean
  verificationPossible: boolean
  dismissedGoldEducation: boolean
  incomingPaymentRequests: PaymentRequest[]
  outgoingPaymentRequests: PaymentRequest[]
  extraNotifications: IdToNotification
  reclaimableEscrowPayments: EscrowedPayment[]
  invitees: InviteDetails[]
}

interface DispatchProps {
  dismissNotification: typeof dismissNotification
  dismissInviteFriends: typeof dismissInviteFriends
  dismissGetVerified: typeof dismissGetVerified
  dismissGoldEducation: typeof dismissGoldEducation
  openUrl: typeof openUrlAction
}

type Props = DispatchProps & StateProps & WithTranslation

const mapStateToProps = (state: RootState): StateProps => ({
  backupCompleted: state.account.backupCompleted,
  numberVerified: state.app.numberVerified,
  goldEducationCompleted: state.goldToken.educationCompleted,
  incomingPaymentRequests: getIncomingPaymentRequests(state),
  outgoingPaymentRequests: getOutgoingPaymentRequests(state),
  extraNotifications: getExtraNotifications(state),
  dismissedInviteFriends: state.account.dismissedInviteFriends,
  dismissedGetVerified: state.account.dismissedGetVerified,
  verificationPossible: verificationPossibleSelector(state),
  dismissedGoldEducation: state.account.dismissedGoldEducation,
  reclaimableEscrowPayments: getReclaimableEscrowPayments(state),
  invitees: inviteesSelector(state),
})

const mapDispatchToProps = {
  dismissNotification,
  dismissInviteFriends,
  dismissGetVerified,
  dismissGoldEducation,
  openUrl: openUrlAction,
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
      dismissedInviteFriends,
      dismissedGetVerified,
      verificationPossible,
      dismissedGoldEducation,
      openUrl,
    } = this.props
    const actions: SimpleMessagingCardProps[] = []

    if (!backupCompleted) {
      actions.push({
        text: t('backupKeyFlow6:backupKeyNotification'),
        icon: backupKey,
        callToActions: [
          {
            text: t('backupKeyFlow6:introPrimaryAction'),
            onPress: () => {
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.backup_prompt,
                selectedAction: NotificationBannerCTATypes.accept,
              })
              ensurePincode()
                .then((pinIsCorrect) => {
                  if (pinIsCorrect) {
                    navigate(Screens.BackupIntroduction)
                  }
                })
                .catch((error) => {
                  Logger.error(`${TAG}@backupNotification`, 'PIN ensure error', error)
                })
            },
          },
        ],
      })
    }

    if (!dismissedGetVerified && !numberVerified && verificationPossible) {
      actions.push({
        text: t('nuxVerification2:notification.body'),
        icon: getVerified,
        callToActions: [
          {
            text: t('nuxVerification2:notification.cta'),
            onPress: () => {
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.verification_prompt,
                selectedAction: NotificationBannerCTATypes.accept,
              })
              navigate(Screens.VerificationEducationScreen, {
                hideOnboardingStep: true,
              })
            },
          },
          {
            text: t('global:dismiss'),
            onPress: () => {
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.verification_prompt,
                selectedAction: NotificationBannerCTATypes.decline,
              })
              this.props.dismissGetVerified()
            },
          },
        ],
      })
    }

    for (const [id, notification] of Object.entries(this.props.extraNotifications)) {
      if (!notification) {
        continue
      }
      const texts = getContentForCurrentLang(notification.content)
      if (!texts) {
        continue
      }

      actions.push({
        text: texts.body,
        icon: notification.iconUrl ? { uri: notification.iconUrl } : undefined,
        darkMode: notification.darkMode,
        callToActions: [
          {
            text: texts.cta,
            onPress: () => {
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.remote_notification,
                selectedAction: NotificationBannerCTATypes.remote_notification_cta,
              })
              openUrl(notification.ctaUri, false, true)
            },
          },
          {
            text: texts.dismiss,
            dim: notification.darkMode,
            onPress: () => {
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.remote_notification,
                selectedAction: NotificationBannerCTATypes.decline,
              })
              this.props.dismissNotification(id)
            },
          },
        ],
      })
    }

    if (!dismissedGoldEducation && !goldEducationCompleted) {
      actions.push({
        text: t('exchangeFlow9:whatIsGold'),
        icon: learnCelo,
        callToActions: [
          {
            text: t('learnMore'),
            onPress: () => {
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.celo_asset_education,
                selectedAction: NotificationBannerCTATypes.accept,
              })
              navigate(Screens.GoldEducation)
            },
          },
          {
            text: t('global:dismiss'),
            onPress: () => {
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.celo_asset_education,
                selectedAction: NotificationBannerCTATypes.decline,
              })
              this.props.dismissGoldEducation()
            },
          },
        ],
      })
    }

    if (!dismissedInviteFriends && !pausedFeatures.INVITE) {
      actions.push({
        text: t('inviteFlow11:inviteAnyone'),
        icon: inviteFriends,
        callToActions: [
          {
            text: t('global:connect'),
            onPress: () => {
              this.props.dismissInviteFriends()
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.invite_prompt,
                selectedAction: NotificationBannerCTATypes.accept,
              })
              // TODO: navigate to relevant invite flow
            },
          },
          {
            text: t('global:remind'),
            onPress: () => {
              this.props.dismissInviteFriends()
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.invite_prompt,
                selectedAction: NotificationBannerCTATypes.decline,
              })
            },
          },
        ],
      })
    }

    return actions.map((notification, i) => <SimpleMessagingCard key={i} {...notification} />)
  }

  handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    const { currentIndex } = this.state
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / variables.width)

    if (nextIndex === currentIndex) {
      return
    }

    const direction = nextIndex > currentIndex ? ScrollDirection.next : ScrollDirection.previous
    ValoraAnalytics.track(HomeEvents.notification_scroll, { direction })

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

    if (!notifications.length) {
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
        <Pagination
          style={styles.pagination}
          count={notifications.length}
          activeIndex={this.state.currentIndex}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  body: {
    maxWidth: variables.width,
    width: variables.width,
  },
  notificationContainer: {
    width: variables.width - 2 * variables.contentPadding,
    margin: variables.contentPadding,
    marginBottom: 24, // Enough space so the shadow is not clipped
  },
  pagination: {
    paddingBottom: variables.contentPadding,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.walletFlow5)(NotificationBox))

import ContactCircle from '@celo/react-components/components/ContactCircle'
import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { declinePaymentRequest } from 'src/firebase/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import Logger from 'src/utils/Logger'

interface Props {
  requester: Recipient
  amount: string
  comment: string
  id: string
}

export default function IncomingPaymentRequestListItem({ id, amount, comment, requester }: Props) {
  const { t } = useTranslation(Namespaces.paymentRequestFlow)
  const dispatch = useDispatch()

  const transactionData: TransactionDataInput = {
    reason: comment,
    recipient: requester,
    amount: new BigNumber(amount),
    type: TokenTransactionType.PayRequest,
    firebasePendingRequestUid: id,
  }

  const onPay = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.pay,
    })

    navigate(Screens.AddressFetchLoading, { transactionData })
  }

  const onPaymentDecline = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.decline,
    })
    dispatch(declinePaymentRequest(id))
    Logger.showMessage(t('requestDeclined'))
  }

  const name = requester.displayName
  const requestAmount = {
    value: amount,
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  return (
    <View style={styles.container}>
      <RequestMessagingCard
        testID={`IncomingPaymentRequestNotification/${id}`}
        title={t('incomingPaymentRequestNotificationTitle', { name })}
        details={comment}
        amount={<CurrencyDisplay amount={requestAmount} />}
        icon={
          <ContactCircle
            address={requester.address}
            name={requester.displayName}
            thumbnailPath={getRecipientThumbnail(requester)}
          />
        }
        callToActions={[
          {
            text: t('global:send'),
            onPress: onPay,
          },
          {
            text: t('global:decline'),
            onPress: onPaymentDecline,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
})

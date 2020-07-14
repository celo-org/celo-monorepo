import ContactCircle from '@celo/react-components/components/ContactCircle'
import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import BigNumber from 'bignumber.js'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { errorSelector } from 'src/alert/reducer'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { declinePaymentRequest } from 'src/firebase/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  AddressValidationType,
  isFetchingAddressesSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
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
  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const isFetchingAddresses = useSelector(isFetchingAddressesSelector)
  const error = useSelector(errorSelector)
  const prevIsFetchingAddressesRef = useRef(isFetchingAddresses)
  const [isLoading, setIsLoading] = useState(false)

  const transactionData: TransactionDataInput = {
    reason: comment,
    recipient: requester,
    amount: new BigNumber(amount),
    type: TokenTransactionType.PayRequest,
    firebasePendingRequestUid: id,
  }
  const { recipient } = transactionData
  const { e164PhoneNumber } = recipient
  const addressValidationType = getAddressValidationType(recipient, secureSendPhoneNumberMapping)

  const onPay = () => {
    if (e164PhoneNumber) {
      setIsLoading(true)
      // Need to check latest mapping to prevent user from accepting fradulent requests
      dispatch(fetchAddressesAndValidate(e164PhoneNumber))
    } else {
      navigateToNextScreen()
    }

    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.pay,
    })
  }

  const onPaymentDecline = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.decline,
    })
    dispatch(declinePaymentRequest(id))
    Logger.showMessage(t('requestDeclined'))
  }

  const navigateToNextScreen = () => {
    if (
      addressValidationType === AddressValidationType.FULL ||
      addressValidationType === AddressValidationType.PARTIAL
    ) {
      navigate(Screens.ValidateRecipientIntro, { transactionData, addressValidationType })
    } else {
      navigate(Screens.SendConfirmation, { transactionData })
    }
  }

  React.useEffect(() => {
    const prevIsFetchingAddresses = prevIsFetchingAddressesRef.current
    prevIsFetchingAddressesRef.current = isFetchingAddresses

    if (prevIsFetchingAddresses === true && isFetchingAddresses === false) {
      setIsLoading(false)
      if (!error) {
        navigateToNextScreen()
      }
    }
  }, [isFetchingAddresses, error])

  return (
    <View style={styles.container}>
      <RequestMessagingCard
        testID={`IncomingPaymentRequestNotification/${id}`}
        title={t('incomingPaymentRequestNotificationTitle', { name: requester.displayName })}
        details={comment}
        amount={
          <CurrencyDisplay
            amount={{
              value: amount,
              currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
            }}
          />
        }
        icon={
          <ContactCircle
            address={requester.address}
            name={requester.displayName}
            thumbnailPath={getRecipientThumbnail(requester)}
          />
        }
        callToActions={[
          {
            text: isLoading ? (
              <ActivityIndicator testID={'loading/paymentRequest'} />
            ) : (
              t('global:send')
            ),
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

import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import ContactCircle from 'src/components/ContactCircle'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import { AddressValidationType, SecureSendDetails } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { declinePaymentRequest } from 'src/paymentRequest/actions'
import { Recipient, recipientHasAddress, recipientHasNumber } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import Logger from 'src/utils/Logger'

interface Props {
  id: string
  requester: Recipient
  amount: string
  comment?: string
}

export default function IncomingPaymentRequestListItem({ id, amount, comment, requester }: Props) {
  const { t } = useTranslation(Namespaces.paymentRequestFlow)
  const dispatch = useDispatch()
  const [payButtonPressed, setPayButtonPressed] = useState(false)
  const [addressesFetched, setAddressesFetched] = useState(false)
  const navigation = useNavigation()

  const e164PhoneNumber = recipientHasNumber(requester) ? requester.e164PhoneNumber : undefined
  const requesterAddress = recipientHasAddress(requester) ? requester.address : undefined

  const secureSendDetails: SecureSendDetails | undefined = useSelector(
    (state: RootState) => state.identity.secureSendPhoneNumberMapping[e164PhoneNumber || '']
  )

  const onPayButtonPressed = () => {
    setPayButtonPressed(true)
    if (e164PhoneNumber) {
      // Need to check latest mapping to prevent user from accepting fradulent requests
      dispatch(fetchAddressesAndValidate(e164PhoneNumber, requesterAddress))
    } else {
      navigateToNextScreen()
    }

    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.pay,
    })
  }

  const onDeclineButtonPressed = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.decline,
    })
    dispatch(declinePaymentRequest(id))
    Logger.showMessage(t('requestDeclined'))
  }

  const navigateToNextScreen = () => {
    const transactionData: TransactionDataInput = {
      reason: comment,
      recipient: requester,
      amount: new BigNumber(amount),
      type: TokenTransactionType.PayRequest,
      firebasePendingRequestUid: id,
    }

    const addressValidationType =
      secureSendDetails?.addressValidationType || AddressValidationType.NONE

    const origin = SendOrigin.AppRequestFlow
    if (addressValidationType === AddressValidationType.NONE) {
      navigate(Screens.SendConfirmation, { transactionData, origin })
    } else {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
        requesterAddress,
        origin,
      })
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      const removeButtonFocusListener = navigation.addListener('focus', () => {
        setPayButtonPressed(false)
        setAddressesFetched(false)
      })

      return removeButtonFocusListener
    }, [])
  )

  React.useEffect(() => {
    // Need this to make sure it's only triggered on click
    if (!payButtonPressed) {
      return
    }

    const isFetchingAddresses = secureSendDetails?.isFetchingAddresses

    if (isFetchingAddresses) {
      setAddressesFetched(true)
    }

    if (addressesFetched && isFetchingAddresses === false) {
      setPayButtonPressed(false)
      if (secureSendDetails?.lastFetchSuccessful) {
        navigateToNextScreen()
      }
    }
  }, [payButtonPressed, secureSendDetails])

  return (
    <View style={styles.container}>
      <RequestMessagingCard
        testID={`IncomingPaymentRequestNotification/${id}`}
        title={t('incomingPaymentRequestNotificationTitle', { name: requester.name })}
        details={comment}
        amount={
          <CurrencyDisplay
            amount={{
              value: amount,
              currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
            }}
          />
        }
        icon={<ContactCircle recipient={requester} />}
        callToActions={[
          {
            text: payButtonPressed ? (
              <ActivityIndicator testID={'loading/paymentRequest'} />
            ) : (
              t('global:send')
            ),
            onPress: onPayButtonPressed,
          },
          {
            text: t('global:decline'),
            onPress: onDeclineButtonPressed,
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

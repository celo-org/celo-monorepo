import ContactCircle from '@celo/react-components/components/ContactCircle'
import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import TextButton from '@celo/react-components/components/TextButton'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { iconHitslop } from '@celo/react-components/styles/variables'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { FeeEvents, SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import BackButton from 'src/components/BackButton'
import CommentTextInput from 'src/components/CommentTextInput'
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import FeeDrawer from 'src/components/FeeDrawer'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import ShortenedAddress from 'src/components/ShortenedAddress'
import TotalLineItem from 'src/components/TotalLineItem'
import { FeeType } from 'src/fees/actions'
import CalculateFee, {
  CalculateFeeChildren,
  PropsWithoutChildren as CalculateFeeProps,
} from 'src/fees/CalculateFee'
import { getFeeDollars } from 'src/fees/selectors'
import i18n, { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'
import { fetchDataEncryptionKey } from 'src/identity/actions'
import {
  addressToDataEncryptionKeySelector,
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { getAddressValidationType, getSecureSendAddress } from 'src/identity/secureSend'
import { InviteBy } from 'src/invite/actions'
import { getInvitationVerificationFeeInDollars } from 'src/invite/saga'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyCode, getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getDisplayName, getRecipientThumbnail } from 'src/recipients/recipient'
import { isAppConnected } from 'src/redux/selectors'
import { sendPaymentOrInvite } from 'src/send/actions'
import { isSendingSelector } from 'src/send/selectors'
import { getConfirmationInput } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import Logger from 'src/utils/Logger'
import { currentAccountSelector, isDekRegisteredSelector } from 'src/web3/selectors'

export interface CurrencyInfo {
  localCurrencyCode: LocalCurrencyCode
  localExchangeRate: string
}

type OwnProps = StackScreenProps<StackParamList, Screens.SendConfirmation>
type Props = OwnProps

export const sendConfirmationScreenNavOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton eventName={SendEvents.send_confirm_back} />,
})

function SendConfirmation(props: Props) {
  const [modalVisible, setModalVisible] = useState(false)
  const [encryptionDialogVisible, setEncryptionDialogVisible] = useState(false)
  const [comment, setComment] = useState('')

  const dispatch = useDispatch()
  const { t } = useTranslation(Namespaces.sendFlow7)

  const { transactionData, addressJustValidated, currencyInfo } = props.route.params
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const confirmationInput = getConfirmationInput(
    transactionData,
    e164NumberToAddress,
    secureSendPhoneNumberMapping
  )
  const {
    type,
    amount,
    recipient,
    recipientAddress,
    firebasePendingRequestUid,
    reason,
  } = confirmationInput
  const addressValidationType = getAddressValidationType(
    transactionData.recipient,
    secureSendPhoneNumberMapping
  )
  // Undefined or null means no addresses ever validated through secure send
  const validatedRecipientAddress = getSecureSendAddress(
    transactionData.recipient,
    secureSendPhoneNumberMapping
  )
  const account = useSelector(currentAccountSelector)
  const isSending = useSelector(isSendingSelector)
  // tslint:disable-next-line: react-hooks-nesting
  const dollarBalance = useSelector(stableTokenBalanceSelector) || '0'
  const appConnected = useSelector(isAppConnected)
  const isDekRegistered = useSelector(isDekRegisteredSelector) ?? false
  const addressToDataEncryptionKey = useSelector(addressToDataEncryptionKeySelector)

  let newCurrencyInfo: CurrencyInfo = {
    localCurrencyCode: useSelector(getLocalCurrencyCode),
    // tslint:disable-next-line: react-hooks-nesting
    localExchangeRate: useSelector(getLocalCurrencyExchangeRate) || '',
  }
  if (currencyInfo) {
    newCurrencyInfo = currencyInfo
  }

  useEffect(() => {
    dispatch(fetchDollarBalance())
    if (addressJustValidated) {
      Logger.showMessage(t('sendFlow7:addressConfirmed'))
    }
    triggerFetchDataEncryptionKey()
  }, []) // only fired once, due to empty dependency array, mimicking componentDidMount

  const triggerFetchDataEncryptionKey = () => {
    const address = confirmationInput.recipientAddress
    if (address) {
      dispatch(fetchDataEncryptionKey(address))
    }
  }

  const onSendClick = () => {
    if (type === TokenTransactionType.InviteSent) {
      setModalVisible(true)
    } else {
      sendOrInvite()
    }
  }

  const sendOrInvite = (inviteMethod?: InviteBy) => {
    const finalComment =
      type === TokenTransactionType.PayRequest || type === TokenTransactionType.PayPrefill
        ? reason || ''
        : comment

    const localCurrencyAmount = convertDollarsToLocalAmount(
      amount,
      newCurrencyInfo.localExchangeRate
    )

    ValoraAnalytics.track(SendEvents.send_confirm_send, {
      isScan: !!props.route.params?.isFromScan,
      isInvite: !recipientAddress,
      isRequest: type === TokenTransactionType.PayRequest,
      localCurrencyExchangeRate: newCurrencyInfo.localExchangeRate,
      localCurrency: newCurrencyInfo.localCurrencyCode,
      dollarAmount: amount.toString(),
      localCurrencyAmount: localCurrencyAmount ? localCurrencyAmount.toString() : null,
      commentLength: finalComment.length,
    })

    dispatch(
      sendPaymentOrInvite(
        amount,
        finalComment,
        recipient,
        recipientAddress,
        inviteMethod,
        firebasePendingRequestUid
      )
    )
  }

  const onEditAddressClick = () => {
    ValoraAnalytics.track(SendEvents.send_secure_edit)
    navigate(Screens.ValidateRecipientIntro, {
      transactionData,
      addressValidationType,
    })
  }

  const cancelModal = () => {
    setModalVisible(false)
  }

  const sendWhatsApp = () => {
    setModalVisible(false)
    sendOrInvite(InviteBy.WhatsApp)
  }

  const sendSMS = () => {
    setModalVisible(false)
    sendOrInvite(InviteBy.SMS)
  }

  const onBlur = () => {
    const trimmedComment = comment.trim()
    setComment(trimmedComment)
  }

  const onShowEncryptionModal = () => {
    setEncryptionDialogVisible(true)
  }

  const onDismissEncryptionModal = () => {
    setEncryptionDialogVisible(false)
  }

  const renderWithAsyncFee: CalculateFeeChildren = (asyncFee) => {
    const fee = getFeeDollars(asyncFee.result)
    const amountWithFee = amount.plus(fee || 0)
    const userHasEnough = !asyncFee.loading && amountWithFee.isLessThanOrEqualTo(dollarBalance)
    const isPrimaryButtonDisabled = isSending || !userHasEnough || !appConnected || !!asyncFee.error

    const isInvite = type === TokenTransactionType.InviteSent
    const inviteFee = getInvitationVerificationFeeInDollars()

    const subtotalAmount = {
      value: amount || inviteFee,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }

    let primaryBtnInfo
    if (type === TokenTransactionType.PayRequest || type === TokenTransactionType.PayPrefill) {
      primaryBtnInfo = {
        action: sendOrInvite,
        text: i18n.t('global:pay'),
        disabled: isPrimaryButtonDisabled,
      }
    } else {
      primaryBtnInfo = {
        action: onSendClick,
        text: t('global:send'),
        disabled: isPrimaryButtonDisabled,
      }
    }

    const paymentComment = reason || ''

    const FeeContainer = () => {
      let securityFee
      let dekFee
      if (isInvite && fee) {
        // 'fee' already contains the invitation fee for invites
        // so we adjust it here
        securityFee = fee.minus(inviteFee)
      } else if (!isDekRegistered && fee) {
        // 'fee' contains cost for both DEK registration and
        // send payment so we adjust it here
        securityFee = fee.dividedBy(2)
        dekFee = fee.dividedBy(2)
      }

      ValoraAnalytics.track(FeeEvents.fee_rendered, {
        feeType: 'Security',
        fee: securityFee ? securityFee.toString() : securityFee,
      })
      const totalAmount = {
        value: amountWithFee,
        currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
      }

      return (
        <View style={styles.feeContainer}>
          <FeeDrawer
            testID={'feeDrawer/SendConfirmation'}
            isEstimate={true}
            currency={CURRENCY_ENUM.DOLLAR}
            inviteFee={inviteFee}
            isInvite={isInvite}
            securityFee={securityFee}
            showDekfee={!isDekRegistered}
            dekFee={dekFee}
            feeLoading={asyncFee.loading}
            feeHasError={!!asyncFee.error}
            totalFee={fee}
            currencyInfo={newCurrencyInfo}
          />
          <TotalLineItem amount={totalAmount} currencyInfo={newCurrencyInfo} />
        </View>
      )
    }

    const EncryptionWarningLabel = () => {
      const showLabel = !recipientAddress || addressToDataEncryptionKey[recipientAddress] === null

      return showLabel ? (
        <View style={styles.encryptionWarningLabelContainer}>
          <Text style={styles.encryptionWarningLabel}>{t('encryption.warningLabel')}</Text>
          <Touchable onPress={onShowEncryptionModal} borderless={true} hitSlop={iconHitslop}>
            <InfoIcon size={12} />
          </Touchable>
        </View>
      ) : null
    }

    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <DisconnectBanner />
        <ReviewFrame
          FooterComponent={FeeContainer}
          LabelAboveKeyboard={EncryptionWarningLabel}
          confirmButton={primaryBtnInfo}
          isSending={isSending}
        >
          <View style={styles.transferContainer}>
            {isInvite && <Text style={styles.inviteText}>{t('inviteMoneyEscrow')}</Text>}
            <View style={styles.headerContainer}>
              <ContactCircle
                name={transactionData.recipient.displayName}
                thumbnailPath={getRecipientThumbnail(recipient)}
                address={recipientAddress || ''}
              />
              <View style={styles.recipientInfoContainer}>
                <Text style={styles.headerText} testID="HeaderText">
                  {t('sending')}
                </Text>
                <Text style={styles.displayName}>
                  {getDisplayName({ recipient, recipientAddress, t })}
                </Text>
                {validatedRecipientAddress && (
                  <View style={styles.editContainer}>
                    <ShortenedAddress style={styles.address} address={validatedRecipientAddress} />
                    <TextButton
                      style={styles.editButton}
                      testID={'accountEditButton'}
                      onPress={onEditAddressClick}
                    >
                      {t('edit')}
                    </TextButton>
                  </View>
                )}
              </View>
            </View>
            <CurrencyDisplay
              type={DisplayType.Default}
              style={styles.amount}
              amount={subtotalAmount}
              currencyInfo={newCurrencyInfo}
            />
            {type === TokenTransactionType.PayRequest ||
            type === TokenTransactionType.PayPrefill ? (
              <View>
                <Text style={styles.paymentComment}>{paymentComment}</Text>
              </View>
            ) : (
              <CommentTextInput
                testID={'send'}
                onCommentChange={setComment}
                comment={comment}
                onBlur={onBlur}
              />
            )}
          </View>
          <InviteOptionsModal
            isVisible={modalVisible}
            onWhatsApp={sendWhatsApp}
            onSMS={sendSMS}
            onCancel={cancelModal}
          />
          {/** Encryption warning dialog */}
          <Dialog
            title={t('encryption.warningModalHeader')}
            isVisible={encryptionDialogVisible}
            actionText={t('global:dismiss')}
            actionPress={onDismissEncryptionModal}
          >
            {t('encryption.warningModalBody')}
          </Dialog>
        </ReviewFrame>
      </SafeAreaView>
    )
  }

  if (!account) {
    throw Error('Account is required')
  }
  const feeProps: CalculateFeeProps = recipientAddress
    ? {
        feeType: FeeType.SEND,
        account,
        recipientAddress,
        amount: amount.valueOf(),
        includeDekFee: !isDekRegistered,
      }
    : { feeType: FeeType.INVITE, account, amount }

  return (
    // Note: intentionally passing a new child func here otherwise
    // it doesn't re-render on state change since CalculateFee is a pure component
    <CalculateFee {...feeProps}>{(asyncFee) => renderWithAsyncFee(asyncFee)}</CalculateFee>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  feeContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  inviteText: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingBottom: 24,
  },
  transferContainer: {
    alignItems: 'flex-start',
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipientInfoContainer: {
    paddingLeft: 8,
  },
  headerText: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
  displayName: {
    ...fontStyles.regular500,
  },
  editContainer: {
    flexDirection: 'row',
  },
  address: {
    ...fontStyles.small,
    color: colors.gray5,
    paddingRight: 4,
  },
  editButton: {
    ...fontStyles.small,
    color: colors.gray5,
    textDecorationLine: 'underline',
  },
  amount: {
    paddingVertical: 8,
    ...fontStyles.largeNumber,
  },
  paymentComment: {
    ...fontStyles.large,
    color: colors.gray5,
  },
  encryptionWarningLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  encryptionWarningLabel: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingRight: 8,
  },
})

export default SendConfirmation

import { AccountAuthRequest, CURRENCY_ENUM, SignTxRequest } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { AddressValidationType } from 'src/identity/reducer'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TransferConfirmationCardProps } from 'src/send/TransferConfirmationCard'
import { ReviewProps } from 'src/transactions/TransactionReview'

// tslint:disable-next-line
export type StackParamList = {
  [Screens.Account]: {}
  [Screens.Analytics]: {}
  [Screens.BackupComplete]: {}
  [Screens.BackupIntroduction]: {}
  [Screens.BackupPhrase]: {}
  [Screens.BackupQuiz]: {
    mnemonic: string
  }
  [Screens.BackupSocial]: {}
  [Screens.BackupSocialIntro]: {
    incomingFromBackupFlow: boolean
  }
  [Screens.DappKitAccountAuth]: {
    dappKitRequest: AccountAuthRequest
  }
  [Screens.DappKitSignTxScreen]: {
    dappKitRequest: SignTxRequest
  }
  [Screens.DappKitTxDataScreen]: {
    dappKitData: SignTxRequest
  }
  [Screens.DataSaver]: {
    promptModalVisible: boolean
  }
  [Screens.Debug]: {}
  [Screens.DollarEducation]: {}
  [Screens.EditProfile]: {}
  [Screens.EnterInviteCode]: {}
  [Screens.ErrorScreen]: {
    errorMessage?: string
  }
  [Screens.EscrowedPaymentListScreen]: {}
  [Screens.ExchangeHomeScreen]: {}
  [Screens.ExchangeReview]: {
    exchangeInput: {
      makerToken: CURRENCY_ENUM
      makerTokenBalance: string
      inputToken: CURRENCY_ENUM
      inputTokenDisplayName: string
      inputAmount: BigNumber
    }
  }
  [Screens.ExchangeTradeScreen]: {
    makerTokenDisplay: {
      makerToken: CURRENCY_ENUM
      makerTokenBalance: string
    }
  }
  [Screens.FeeEducation]: {}
  [Screens.FeeExchangeEducation]: {}
  [Screens.FiatExchange]: {}
  [Screens.GoldEducation]: {}
  [Screens.ImportWallet]: {
    clean: boolean
  }
  [Screens.ImportWalletEmpty]: {
    backupPhrase: string
  }
  [Screens.ImportWalletSocial]: {}
  [Screens.IncomingPaymentRequestListScreen]: {}
  [Screens.Invite]: {}
  [Screens.InviteReview]: {
    recipient: Recipient
  }
  [Screens.JoinCelo]: {}
  [Screens.Language]: {
    nextScreen?: Screens.Account
  }
  [Screens.Licenses]: {}
  [Screens.OutgoingPaymentRequestListScreen]: {}
  [Screens.PaymentRequestConfirmation]: {
    transactionData: TransactionDataInput
  }
  [Screens.PincodeEducation]: {}
  [Screens.PincodeEnter]: {
    withVerification?: boolean
    onSuccess: (pin: string) => void
  }
  [Screens.PincodeSet]: {}
  [Screens.PhoneNumberLookupQuota]: {
    onBuy: () => void
    onSkip: () => void
  }
  [Screens.PhotosEducation]: {}
  [Screens.PhotosNUX]: {}
  [Screens.Profile]: {}
  [Screens.QRCode]: {}
  [Screens.QRScanner]: {
    scanIsForSecureSend?: true
    transactionData?: TransactionDataInput
  }
  [Screens.ReclaimPaymentConfirmationScreen]: {
    reclaimPaymentInput: EscrowedPayment
  }
  [Screens.RegulatoryTerms]: {}
  [Screens.Security]: {}
  [Screens.SelectLocalCurrency]: {}
  [Screens.Send]: {}
  [Screens.SendAmount]: {
    recipient: Recipient
  }
  [Screens.SendConfirmation]: {
    transactionData: TransactionDataInput
  }
  [Screens.SetClock]: {}
  [Screens.Settings]: {}
  [Screens.Support]: {}
  [Screens.SupportContact]: {}
  [Screens.Sync]: {}
  [Screens.TabNavigator]: {}
  [Screens.TransactionReview]: {
    reviewProps: ReviewProps
    confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
  }
  [Screens.UpgradeScreen]: {}
  [Screens.ValidateRecipientIntro]: {
    transactionData: TransactionDataInput
    addressValidationType: AddressValidationType
    isPaymentRequest?: true
  }
  [Screens.ValidateRecipientAccount]: {
    transactionData: TransactionDataInput
    addressValidationType: AddressValidationType
    isPaymentRequest?: true
  }
  [Screens.VerificationEducationScreen]: {}
  [Screens.VerificationInputScreen]: {}
  [Screens.VerificationInterstitialScreen]: {}
  [Screens.VerificationLearnMoreScreen]: {}
  [Screens.VerificationLoadingScreen]: {}
  [Screens.VerificationSuccessScreen]: {}
  [Screens.WalletHome]: {}
}

import { AccountAuthRequest, CURRENCY_ENUM, SignTxRequest } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { Screens } from 'src/navigator/Screens'
import { ConfirmationInput as PaymentRequestConfirmationInput } from 'src/paymentRequest/PaymentRequestConfirmation'
import { Recipient } from 'src/recipients/recipient'
import { ConfirmationInput } from 'src/send/SendConfirmation'
import { TransferConfirmationCardProps } from 'src/send/TransferConfirmationCard'
import { ReviewProps } from 'src/transactions/TransactionReview'

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
  [Screens.ErrorScreen]: {
    errorMessage: string
  }
  [Screens.EscrowedPaymentListScreen]: {}
  [Screens.ExchangeReview]: {
    exchangeInput: {
      makerToken: CURRENCY_ENUM
      makerTokenBalance: string
      inputToken: CURRENCY_ENUM
      inputTokenDisplayName: string
      inputAmount: BigNumber
    }
  }
  [Screens.EnterInviteCode]: {}
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
    nextScreen?: Screens
  }
  [Screens.Licenses]: {}
  [Screens.OutgoingPaymentRequestListScreen]: {}
  [Screens.PaymentRequestConfirmation]: {
    confirmationInput: PaymentRequestConfirmationInput
  }
  [Screens.PincodeEducation]: {}
  [Screens.PincodeEnter]: {
    withVerification?: boolean
    onSuccess: (pin: string) => void
  }
  [Screens.PincodeSet]: {}
  [Screens.PhotosEducation]: {}
  [Screens.Profile]: {}
  [Screens.QRCode]: {}
  [Screens.QRScanner]: {}
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
    confirmationInput: ConfirmationInput
  }
  [Screens.SetClock]: {}
  [Screens.Support]: {}
  [Screens.SupportContact]: {}
  [Screens.TabNavigator]: {}
  [Screens.TransactionReview]: {
    reviewProps: ReviewProps
    confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
  }
  [Screens.UpgradeScreen]: {}
  [Screens.VerificationEducationScreen]: {}
  [Screens.VerificationInputScreen]: {}
  [Screens.VerificationInterstitialScreen]: {}
  [Screens.VerificationLearnMoreScreen]: {}
  [Screens.VerificationLoadingScreen]: {}
  [Screens.VerificationSuccessScreen]: {}
}

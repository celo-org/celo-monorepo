import { AccountAuthRequest, CURRENCY_ENUM, SignTxRequest, TxToSignParam } from '@celo/utils'
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
  [Screens.Account]: undefined
  [Screens.Analytics]: undefined
  [Screens.BackupComplete]: undefined
  [Screens.BackupIntroduction]: undefined
  [Screens.BackupPhrase]: undefined
  [Screens.BackupQuiz]: {
    mnemonic: string
  }
  [Screens.BackupSocial]: undefined
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
    dappKitData: TxToSignParam['txData']
  }
  [Screens.DataSaver]: {
    promptModalVisible: boolean
  }
  [Screens.Debug]: undefined
  [Screens.DollarEducation]: undefined
  [Screens.EditProfile]: undefined
  [Screens.EnterInviteCode]: undefined
  [Screens.ErrorScreen]: {
    errorMessage?: string
  }
  [Screens.EscrowedPaymentListScreen]: undefined
  [Screens.ExchangeHomeScreen]: undefined
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
  [Screens.FeeEducation]: undefined
  [Screens.FeeExchangeEducation]: undefined
  [Screens.FiatExchange]: undefined
  [Screens.GoldEducation]: undefined
  [Screens.ImportWallet]:
    | {
        clean: boolean
      }
    | undefined
  [Screens.ImportWalletEmpty]: {
    backupPhrase: string
  }
  [Screens.ImportWalletSocial]: undefined
  [Screens.IncomingPaymentRequestListScreen]: undefined
  [Screens.Invite]: undefined
  [Screens.InviteReview]: {
    recipient: Recipient
  }
  [Screens.JoinCelo]: undefined
  [Screens.Language]: {
    nextScreen?: Screens.Account
  }
  [Screens.Licenses]: undefined
  [Screens.OutgoingPaymentRequestListScreen]: undefined
  [Screens.PaymentRequestConfirmation]: {
    transactionData: TransactionDataInput
  }
  [Screens.PincodeEducation]: undefined
  [Screens.PincodeEnter]: {
    withVerification?: boolean
    onSuccess: (pin: string) => void
  }
  [Screens.PincodeSet]: undefined
  [Screens.PhoneNumberLookupQuota]: {
    onBuy: () => void
    onSkip: () => void
  }
  [Screens.PhotosEducation]: undefined
  [Screens.PhotosNUX]: undefined
  [Screens.Profile]: undefined
  [Screens.QRCode]: undefined
  [Screens.QRScanner]:
    | {
        scanIsForSecureSend?: true
        transactionData?: TransactionDataInput
      }
    | undefined
  [Screens.ReclaimPaymentConfirmationScreen]: {
    reclaimPaymentInput: EscrowedPayment
  }
  [Screens.RegulatoryTerms]: undefined
  [Screens.Security]: undefined
  [Screens.SelectLocalCurrency]: undefined
  [Screens.Send]: undefined
  [Screens.SendAmount]: {
    recipient: Recipient
  }
  [Screens.SendConfirmation]: {
    transactionData: TransactionDataInput
  }
  [Screens.SetClock]: undefined
  [Screens.Settings]: undefined
  [Screens.Support]: undefined
  [Screens.SupportContact]: undefined
  [Screens.Sync]: undefined
  [Screens.TabNavigator]: undefined
  [Screens.TransactionReview]: {
    reviewProps: ReviewProps
    confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
  }
  [Screens.UpgradeScreen]: undefined
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
  [Screens.VerificationEducationScreen]: undefined
  [Screens.VerificationInputScreen]: undefined
  [Screens.VerificationInterstitialScreen]: undefined
  [Screens.VerificationLearnMoreScreen]: undefined
  [Screens.VerificationLoadingScreen]: undefined
  [Screens.VerificationSuccessScreen]: undefined
  [Screens.WalletHome]: undefined
}

import {
  AccountAuthRequest,
  Countries,
  CURRENCY_ENUM,
  SignTxRequest,
  TxToSignParam,
} from '@celo/utils'
import BigNumber from 'bignumber.js'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { AddressValidationType } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { ReviewProps } from 'src/transactions/TransactionReview'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'

// Typed nested navigator params
type NestedNavigatorParams<ParamList> = {
  [K in keyof ParamList]: undefined extends ParamList[K]
    ? { screen: K; params?: ParamList[K] }
    : { screen: K; params: ParamList[K] }
}[keyof ParamList]

// tslint:disable-next-line: interface-over-type-literal
export type StackParamList = {
  [Screens.Account]: undefined
  [Screens.Analytics]: undefined
  [Screens.BackupComplete]: undefined
  [Screens.BackupIntroduction]:
    | {
        fromAccountScreen?: boolean
      }
    | undefined
  [Screens.AccountKeyEducation]:
    | undefined
    | {
        nextScreen: keyof StackParamList
      }
  [Screens.BackupPhrase]: undefined
  [Screens.BackupQuiz]: undefined
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
  [Screens.DrawerNavigator]: undefined
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
  [Screens.FiatExchangeAmount]: {
    isAddFunds: boolean
  }
  [Screens.FiatExchangeOptions]: {
    isAddFunds: boolean
    amount: BigNumber
    currencyCode: LocalCurrencyCode
    isExplanationOpen?: boolean
  }
  [Screens.MoonPay]: undefined
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
  [Screens.ImportContacts]: undefined
  [Screens.IncomingPaymentRequestListScreen]: undefined
  [Screens.Invite]: undefined
  [Screens.InviteReview]: {
    recipient: Recipient
  }
  [Screens.JoinCelo]: { selectedCountryCodeAlpha2: string } | undefined
  [Screens.Language]:
    | {
        nextScreen: keyof StackParamList | 'GO_BACK'
      }
    | undefined
  [Screens.Licenses]: undefined
  [Screens.Main]: undefined
  [Screens.OutgoingPaymentRequestListScreen]: undefined
  [Screens.PaymentRequestUnavailable]: {
    transactionData: TransactionDataInput
  }
  [Screens.PaymentRequestConfirmation]: {
    transactionData: TransactionDataInput
    addressJustValidated?: boolean
  }
  [Screens.PincodeEnter]: {
    withVerification?: boolean
    onSuccess: (pin: string) => void
  }
  [Screens.PincodeSet]: { isVerifying: boolean } | undefined
  [Screens.PhoneNumberLookupQuota]: {
    onBuy: () => void
    onSkip: () => void
  }
  [Screens.PhotosEducation]: undefined
  [Screens.PhotosNUX]: undefined
  [Screens.Profile]: undefined
  [Screens.QRNavigator]: NestedNavigatorParams<QRTabParamList> | undefined
  [Screens.ReclaimPaymentConfirmationScreen]: {
    reclaimPaymentInput: EscrowedPayment
  }
  [Screens.RegulatoryTerms]: undefined
  [Screens.Security]: undefined
  [Screens.SelectCountry]: {
    countries: Countries
    selectedCountryCodeAlpha2: string
  }
  [Screens.SelectLocalCurrency]: undefined
  [Screens.Send]:
    | {
        isRequest?: boolean
      }
    | undefined
  [Screens.SendAmount]: {
    recipient: Recipient
    isRequest?: boolean
    isFromScan?: boolean
  }
  [Screens.SendConfirmation]: {
    transactionData: TransactionDataInput
    addressJustValidated?: boolean
    isFromScan?: boolean
  }
  [Screens.SetClock]: undefined
  [Screens.Settings]: undefined
  [Screens.Support]: undefined
  [Screens.SupportContact]: undefined
  [Screens.Sync]: undefined
  [Screens.TransactionReview]: {
    reviewProps: ReviewProps
    confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
  }
  [Screens.UpgradeScreen]: undefined
  [Screens.ValidateRecipientIntro]: {
    transactionData: TransactionDataInput
    addressValidationType: AddressValidationType
    isPaymentRequest?: true
    isFromScan?: boolean
  }
  [Screens.ValidateRecipientAccount]: {
    transactionData: TransactionDataInput
    addressValidationType: AddressValidationType
    isPaymentRequest?: true
    isFromScan?: boolean
  }
  [Screens.VerificationEducationScreen]: { showSkipDialog: boolean } | undefined
  [Screens.VerificationInputScreen]: { showHelpDialog: boolean } | undefined
  [Screens.VerificationInterstitialScreen]: undefined
  [Screens.VerificationLoadingScreen]: undefined
  [Screens.OnboardingSuccessScreen]: undefined
  [Screens.WalletHome]: undefined
}

// tslint:disable-next-line: interface-over-type-literal
export type QRTabParamList = {
  [Screens.QRCode]: undefined
  [Screens.QRScanner]:
    | {
        scanIsForSecureSend?: true
        transactionData?: TransactionDataInput
      }
    | undefined
}

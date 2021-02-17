import {
  AccountAuthRequest,
  Countries,
  CURRENCY_ENUM,
  SignTxRequest,
  TxToSignParam,
} from '@celo/utils'
import BigNumber from 'bignumber.js'
import { SendOrigin } from 'src/analytics/types'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { AddressValidationType } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { CurrencyInfo } from 'src/send/SendConfirmation'
import { ReviewProps } from 'src/transactions/TransactionReview'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'

// Typed nested navigator params
type NestedNavigatorParams<ParamList> = {
  [K in keyof ParamList]: undefined extends ParamList[K]
    ? { screen: K; params?: ParamList[K] }
    : { screen: K; params: ParamList[K] }
}[keyof ParamList]

interface SendConfirmationParams {
  origin: SendOrigin
  transactionData: TransactionDataInput
  addressJustValidated?: boolean
  isFromScan?: boolean
  currencyInfo?: CurrencyInfo
}

// tslint:disable-next-line: interface-over-type-literal
export type StackParamList = {
  [Screens.BackupComplete]:
    | undefined
    | {
        navigatedFromSettings: boolean
      }
  [Screens.BackupIntroduction]:
    | {
        navigatedFromSettings?: boolean
      }
    | undefined
  [Screens.AccountKeyEducation]:
    | undefined
    | {
        nextScreen: keyof StackParamList
      }
  [Screens.BackupPhrase]:
    | undefined
    | {
        navigatedFromSettings: boolean
      }
  [Screens.BackupForceScreen]: undefined
  [Screens.BackupQuiz]:
    | undefined
    | {
        navigatedFromSettings: boolean
      }
  [Screens.BidaliScreen]: { currency: CURRENCY_ENUM }
  [Screens.ConsumerIncentivesHomeScreen]: undefined
  [Screens.DappKitAccountAuth]: {
    dappKitRequest: AccountAuthRequest
  }
  [Screens.DappKitSignTxScreen]: {
    dappKitRequest: SignTxRequest
  }
  [Screens.DappKitTxDataScreen]: {
    dappKitData: TxToSignParam['txData']
  }
  [Screens.Debug]: undefined
  [Screens.DrawerNavigator]: undefined
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
  [Screens.ExternalExchanges]: {
    currency: CURRENCY_ENUM
  }
  [Screens.FiatExchange]: undefined
  [Screens.FiatExchangeOptions]: {
    isCashIn?: boolean
    amount?: BigNumber
  }
  [Screens.MoonPayScreen]: {
    localAmount: number
    currencyCode: LocalCurrencyCode
    currencyToBuy: CURRENCY_ENUM
  }
  [Screens.RampScreen]: {
    localAmount: number
    currencyCode: LocalCurrencyCode
    currencyToBuy: CURRENCY_ENUM
  }
  [Screens.TransakScreen]: {
    localAmount: number
    currencyCode: LocalCurrencyCode
    currencyToBuy: CURRENCY_ENUM
  }
  [Screens.GoldEducation]: undefined
  [Screens.ImportWallet]:
    | {
        clean: boolean
        showZeroBalanceModal?: boolean
      }
    | undefined

  [Screens.ImportContacts]:
    | undefined
    | {
        onPressSkip?: () => void
      }
  [Screens.IncomingPaymentRequestListScreen]: undefined
  [Screens.NameAndPicture]: undefined
  [Screens.Language]:
    | {
        nextScreen: keyof StackParamList
      }
    | undefined
  [Screens.LanguageModal]:
    | {
        nextScreen: keyof StackParamList
      }
    | undefined
  [Screens.Licenses]: undefined
  [Screens.LocalProviderCashOut]: {
    uri: string
  }
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
    onCancel: () => void
  }
  [Screens.PincodeSet]: { isVerifying: boolean } | undefined
  [Screens.PhoneNumberLookupQuota]: {
    onBuy: () => void
    onSkip: () => void
  }
  [Screens.PhotosEducation]: undefined
  [Screens.PhotosNUX]: undefined
  [Screens.Profile]: undefined
  [Screens.ProviderOptionsScreen]: {
    isCashIn?: boolean
    currency: CURRENCY_ENUM
  }
  [Screens.QRNavigator]: NestedNavigatorParams<QRTabParamList> | undefined
  [Screens.ReclaimPaymentConfirmationScreen]: {
    reclaimPaymentInput: EscrowedPayment
    onCancel?: () => void
  }
  [Screens.RegulatoryTerms]: undefined
  [Screens.SelectCountry]: {
    countries: Countries
    selectedCountryCodeAlpha2: string
  }
  [Screens.SelectLocalCurrency]: undefined
  [Screens.Send]:
    | {
        isOutgoingPaymentRequest?: true
      }
    | undefined
  [Screens.SendAmount]: {
    recipient: Recipient
    isOutgoingPaymentRequest?: true
    isFromScan?: boolean
    origin: SendOrigin
  }
  [Screens.SendConfirmation]: SendConfirmationParams
  [Screens.SendConfirmationModal]: SendConfirmationParams
  [Screens.SetClock]: undefined
  [Screens.Settings]:
    | { promptFornoModal?: boolean; promptConfirmRemovalModal?: boolean }
    | undefined
  [Screens.Spend]: undefined
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
    isOutgoingPaymentRequest?: true
    requesterAddress?: string
    origin: SendOrigin
  }
  [Screens.ValidateRecipientAccount]: {
    transactionData: TransactionDataInput
    addressValidationType: AddressValidationType
    isOutgoingPaymentRequest?: true
    requesterAddress?: string
    origin: SendOrigin
  }
  [Screens.VerificationEducationScreen]:
    | { showSkipDialog?: boolean; hideOnboardingStep?: boolean; selectedCountryCodeAlpha2?: string }
    | undefined
  [Screens.VerificationInputScreen]: { showHelpDialog: boolean } | undefined
  [Screens.VerificationLoadingScreen]: { withoutRevealing: boolean }
  [Screens.OnboardingEducationScreen]: undefined
  [Screens.OnboardingSuccessScreen]: undefined
  [Screens.WalletHome]: undefined
  [Screens.WebViewScreen]: { uri: string }
  [Screens.Welcome]: undefined
  [Screens.WithdrawCeloQrScannerScreen]: {
    onAddressScanned: (address: string) => void
  }
  [Screens.WithdrawCeloReviewScreen]: {
    amount: BigNumber
    recipientAddress: string
    feeEstimate: BigNumber
    isCashOut: boolean
  }
  [Screens.WithdrawCeloScreen]: {
    isCashOut: boolean
    amount?: BigNumber
    recipientAddress?: string
  }
}

// tslint:disable-next-line: interface-over-type-literal
export type QRTabParamList = {
  [Screens.QRCode]: undefined
  [Screens.QRScanner]:
    | {
        scanIsForSecureSend?: true
        transactionData?: TransactionDataInput
        isOutgoingPaymentRequest?: true
        requesterAddress?: string
      }
    | undefined
}

import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import { ConfirmationInput } from 'src/send/SendConfirmation'
import { TransferConfirmationCardProps } from 'src/send/TransferConfirmationCard'
import { ReviewProps } from 'src/transactions/TransactionReview'

export type StackParamList = {
  [Screens.ImportWallet]: {
    clean: boolean
  }
  [Screens.SendAmount]: {
    recipient: Recipient
  }
  [Screens.PincodeEnter]: {
    withVerification?: boolean
    onSuccess: (pin: string) => void
  }
  [Screens.SendConfirmation]: {
    confirmationInput: ConfirmationInput
  }
  [Screens.TransactionReview]: {
    reviewProps: ReviewProps
    confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
  }
  [Screens.ImportWalletEmpty]: {
    backupPhrase: string
  }
}

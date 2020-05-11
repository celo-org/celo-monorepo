import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'

export type StackParamList = {
  [Screens.ImportWallet]: {
    clean: boolean
  }
  [Screens.SendAmount]: {
    recipient: Recipient
  }
  [Screens.PincodeEnter]: {
    withVerification: boolean
  }
}

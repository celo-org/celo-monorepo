import { newKitFromWeb3 } from '@celo/contractkit'
import { OdisUtils } from '@celo/identity'
import { AuthSigner } from '@celo/identity/lib/odis/query'
import { fetchEnv } from '@celo/phone-number-privacy-common'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { LocalWallet } from '@celo/wallet-local'
import * as functions from 'firebase-functions'
import Web3 from 'web3'

const privateKey = fetchEnv('PRIVATE_KEY')
const phoneNumber = fetchEnv('PHONE_NUMBER')
const accountAddress = normalizeAddressWith0x(privateKeyToAddress(privateKey)) // 0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb

const contractKit = newKitFromWeb3(
  new Web3(functions.config().blockchain.provider),
  new LocalWallet()
)
contractKit.connection.addAccount(privateKey)
contractKit.defaultAccount = accountAddress

export const queryOdisForSalt = () => {
  const authSigner: AuthSigner = {
    authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
    contractKit,
  }

  return OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
    phoneNumber,
    accountAddress,
    authSigner,
    OdisUtils.Query.getServiceContext(functions.config().blockchain.name),
    undefined,
    'monitor:1.0.0'
  )
}

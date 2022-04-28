import { newKit } from '@celo/contractkit'
import { generateKeys, generateMnemonic, MnemonicStrength } from '@celo/cryptographic-utils'
import { OdisUtils } from '@celo/identity'
import { AuthSigner } from '@celo/identity/lib/odis/query'
import { fetchEnv } from '@celo/phone-number-privacy-common'
import { genSessionID } from '@celo/phone-number-privacy-common/lib/utils/logger'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { LocalWallet } from '@celo/wallet-local'
import * as functions from 'firebase-functions'

const haveConfig = !!functions.config().blockchain
const network = () => (haveConfig ? functions.config().blockchain.network : process.env.NETWORK)
const blockchainProvider = () =>
  haveConfig ? functions.config().blockchain.provider : process.env.BLOCKCHAIN_PROVIDER

const phoneNumber = fetchEnv('PHONE_NUMBER')
const contractKit = newKit(blockchainProvider(), new LocalWallet())

const newPrivateKey = async () => {
  const mnemonic = await generateMnemonic(MnemonicStrength.s256_24words)
  return (await generateKeys(mnemonic)).privateKey
}

export const queryOdisForSalt = async () => {
  console.log(network()) // tslint:disable-line:no-console
  console.log(blockchainProvider()) // tslint:disable-line:no-console
  const privateKey = await newPrivateKey()
  const accountAddress = normalizeAddressWith0x(privateKeyToAddress(privateKey))
  contractKit.connection.addAccount(privateKey)
  contractKit.defaultAccount = accountAddress
  const authSigner: AuthSigner = {
    authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
    contractKit,
  }
  return OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
    phoneNumber,
    accountAddress,
    authSigner,
    OdisUtils.Query.getServiceContext(network()),
    undefined,
    undefined,
    'monitor:1.0.0',
    undefined,
    genSessionID()
  )
}

import { newKit } from '@celo/contractkit'
import { OdisUtils } from '@celo/identity'
import { AuthSigner } from '@celo/identity/lib/odis/query'
import { fetchEnv } from '@celo/phone-number-privacy-common'
import { generateKeys, generateMnemonic, MnemonicStrength } from '@celo/utils/lib/account'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { LocalWallet } from '@celo/wallet-local'
import { blockchainProvider, network } from './index'

const phoneNumber = fetchEnv('PHONE_NUMBER')
const contractKit = newKit(blockchainProvider, new LocalWallet())

const newPrivateKey = async () => {
  const mnemonic = await generateMnemonic(MnemonicStrength.s256_24words)
  return (await generateKeys(mnemonic)).privateKey
}

export const queryOdisForSalt = async () => {
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
    OdisUtils.Query.getServiceContext(network),
    undefined,
    'monitor:1.0.0'
  )
}

import { newKit } from '@celo/contractkit'
import { generateKeys, generateMnemonic, MnemonicStrength } from '@celo/cryptographic-utils'
import {
  buildOdisDomain,
  OdisHardeningConfig,
  odisHardenKey,
  odisQueryAuthorizer,
} from '@celo/encrypted-backup'
import { OdisUtils } from '@celo/identity'
import {
  AuthSigner,
  getServiceContext,
  OdisAPI,
  OdisContextName,
} from '@celo/identity/lib/odis/query'
import { CombinerEndpointPNP, fetchEnv } from '@celo/phone-number-privacy-common'
import { genSessionID } from '@celo/phone-number-privacy-common/lib/utils/logger'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { defined } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'

const phoneNumber = fetchEnv('PHONE_NUMBER')

const newPrivateKey = async () => {
  const mnemonic = await generateMnemonic(MnemonicStrength.s256_24words)
  return (await generateKeys(mnemonic)).privateKey
}

export const queryOdisForSalt = async (
  blockchainProvider: string,
  contextName: OdisContextName,
  endpoint: CombinerEndpointPNP.LEGACY_PNP_SIGN | CombinerEndpointPNP.PNP_SIGN
) => {
  console.log(`contextName: ${contextName}`) // tslint:disable-line:no-console
  console.log(`blockchain provider: ${blockchainProvider}`) // tslint:disable-line:no-console

  const serviceContext = getServiceContext(contextName, OdisAPI.PNP)

  const contractKit = newKit(blockchainProvider, new LocalWallet())
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
    serviceContext,
    undefined,
    undefined,
    undefined,
    genSessionID(),
    undefined,
    endpoint
  )
}

export const queryOdisDomain = async (contextName: OdisContextName) => {
  console.log(`contextName: ${contextName}`) // tslint:disable-line:no-console

  const serviceContext = getServiceContext(contextName, OdisAPI.DOMAIN)
  const monitorDomainConfig: OdisHardeningConfig = {
    rateLimit: [
      {
        delay: 0,
        resetTimer: defined(true),
        // Running every 5 min, this should not run out for the next 9 million years
        batchSize: defined(1000000000000),
        repetitions: defined(1000000000000),
      },
    ],
    environment: serviceContext,
  }
  const authorizer = odisQueryAuthorizer(Buffer.from('ODIS domains monitor authorizer test seed'))
  const domain = buildOdisDomain(monitorDomainConfig, authorizer.address)
  // Throws if signature verification fails
  return odisHardenKey(Buffer.from('password'), domain, serviceContext, authorizer.wallet)
}

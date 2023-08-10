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
import { fetchEnv } from '@celo/phone-number-privacy-common'
import { genSessionID } from '@celo/phone-number-privacy-common/lib/utils/logger'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { defined } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import { ACCOUNT_ADDRESS, dekAuthSigner, PRIVATE_KEY } from './resources'

const phoneNumber = fetchEnv('PHONE_NUMBER')

const newPrivateKey = async () => {
  const mnemonic = await generateMnemonic(MnemonicStrength.s256_24words)
  return (await generateKeys(mnemonic)).privateKey
}

export const queryOdisForSalt = async (
  blockchainProvider: string,
  contextName: OdisContextName,
  timeoutMs: number = 10000,
  bypassQuota: boolean = false,
  useDEK: boolean = false
) => {
  let authSigner: AuthSigner
  let accountAddress: string
  console.log(`contextName: ${contextName}`) // tslint:disable-line:no-console
  console.log(`blockchain provider: ${blockchainProvider}`) // tslint:disable-line:no-console
  console.log(`using DEK: ${useDEK}`) // tslint:disable-line:no-console

  const serviceContext = getServiceContext(contextName, OdisAPI.PNP)

  const contractKit = newKit(blockchainProvider, new LocalWallet())

  if (useDEK) {
    accountAddress = ACCOUNT_ADDRESS
    contractKit.connection.addAccount(PRIVATE_KEY)
    contractKit.defaultAccount = accountAddress
    authSigner = dekAuthSigner(0)
  } else {
    const privateKey = await newPrivateKey()
    accountAddress = normalizeAddressWith0x(privateKeyToAddress(privateKey))
    contractKit.connection.addAccount(privateKey)
    contractKit.defaultAccount = accountAddress
    authSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit,
    }
  }

  const abortController = new AbortController()
  const timeout = setTimeout(() => {
    abortController.abort()
    console.log(`ODIS salt request timed out after ${timeoutMs} ms`) // tslint:disable-line:no-console
  }, timeoutMs)
  try {
    const testSessionId = Math.floor(Math.random() * 100000).toString()
    const res = await OdisUtils.Identifier.getObfuscatedIdentifier(
      phoneNumber,
      OdisUtils.Identifier.IdentifierPrefix.PHONE_NUMBER,
      accountAddress,
      authSigner,
      serviceContext,
      undefined,
      undefined,
      undefined,
      bypassQuota ? testSessionId : genSessionID(),
      undefined,
      abortController
    )
    clearTimeout(timeout)

    return res
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

export const queryOdisForQuota = async (
  blockchainProvider: string,
  contextName: OdisContextName,
  timeoutMs: number = 10000
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

  const abortController = new AbortController()
  const timeout = setTimeout(() => {
    abortController.abort()
  }, timeoutMs)

  try {
    const res = await OdisUtils.Quota.getPnpQuotaStatus(
      accountAddress,
      authSigner,
      serviceContext,
      undefined,
      undefined,
      abortController
    )

    clearTimeout(timeout)

    return res
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
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

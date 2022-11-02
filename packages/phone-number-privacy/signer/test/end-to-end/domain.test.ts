import {
  DisableDomainRequest,
  disableDomainRequestEIP712,
  DisableDomainResponseFailure,
  DisableDomainResponseSuccess,
  DomainEndpoint,
  domainHash,
  DomainIdentifiers,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DomainQuotaStatusResponseFailure,
  DomainQuotaStatusResponseSuccess,
  DomainRequestTypeTag,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  DomainRestrictedSignatureResponseSuccess,
  genSessionID,
  KEY_VERSION_HEADER,
  SequentialDelayDomain,
  SequentialDelayStage,
  SignerEndpoint,
  TestUtils,
  ThresholdPoprfClient,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { DomainRequest } from '@celo/phone-number-privacy-common/src'
import { defined, noBool, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import 'isomorphic-fetch'
import { getVersion } from '../../src/config'
const { ACCOUNT_ADDRESS1, PRIVATE_KEY1 } = TestUtils.Values

require('dotenv').config()

jest.setTimeout(60000)

const signerUrl = process.env.ODIS_SIGNER_SERVICE_URL
const expectedVersion = getVersion()

const ODIS_SIGNER_URL = process.env.ODIS_SIGNER_SERVICE_URL

const ODIS_DOMAINS_PUBLIC_POLYNOMIAL = process.env[
  process.env.ODIS_PUBLIC_DOMAINS_POLYNOMIAL_VAR_FOR_TESTS as string
] as string
const ODIS_DOMAINS_PUBLIC_PUBKEY = process.env[
  process.env.ODIS_PUBLIC_DOMAINS_PUBKEY_VAR_FOR_TESTS as string
] as string

describe(`Running against service deployed at ${signerUrl}`, () => {
  const wallet = new LocalWallet()
  wallet.addAccount(PRIVATE_KEY1)

  const disableSalt = 'himalayanPink-disable'
  const quotaSalt = 'himalayanPink-quota'
  const signSalt = 'himalayanPink-sign'

  it('Service is deployed at correct version', async () => {
    const response = await fetch(signerUrl + SignerEndpoint.STATUS, {
      method: 'GET',
    })
    expect(response.status).toBe(200)
    const body = await response.json()
    // This checks against local package.json version, change if necessary
    expect(body.version).toBe(expectedVersion)
  })

  describe(`${SignerEndpoint.DISABLE_DOMAIN}`, () => {
    it('Should respond with 200 on valid request for new domain', async () => {
      const req = await disableRequest(wallet, ACCOUNT_ADDRESS1, `${disableSalt}-${Date.now()}`)
      const res = await queryDomainEndpoint(req, SignerEndpoint.DISABLE_DOMAIN)
      expect(res.status).toBe(200)
      const resBody: DisableDomainResponseSuccess = await res.json()
      expect(resBody).toStrictEqual<DisableDomainResponseSuccess>({
        success: true,
        version: resBody.version,
        status: {
          disabled: true,
          counter: 0,
          timer: 0,
          now: resBody.status.now,
        },
      })
    })

    it('Should respond with 200 on valid request for already disabled domain', async () => {
      const req = await disableRequest(wallet, ACCOUNT_ADDRESS1, disableSalt)
      const res = await queryDomainEndpoint(req, SignerEndpoint.DISABLE_DOMAIN)
      expect(res.status).toBe(200)
      const resBody: DisableDomainResponseSuccess = await res.json()
      expect(resBody).toStrictEqual<DisableDomainResponseSuccess>({
        success: true,
        version: resBody.version,
        status: {
          disabled: true,
          counter: 0,
          timer: 0,
          now: resBody.status.now,
        },
      })
    })

    it('Should respond with 400 on missing request fields', async () => {
      const badRequest = await disableRequest(wallet, ACCOUNT_ADDRESS1, disableSalt)
      // @ts-ignore Intentionally deleting required field
      delete badRequest.domain.version
      const res = await queryDomainEndpoint(badRequest, SignerEndpoint.DISABLE_DOMAIN)
      expect(res.status).toBe(400)
      const resBody: DisableDomainResponseFailure = await res.json()
      expect(resBody).toStrictEqual<DisableDomainResponseFailure>({
        success: false,
        version: resBody.version,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 400 on unknown domain', async () => {
      const badRequest = await disableRequest(wallet, ACCOUNT_ADDRESS1, disableSalt)
      // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
      badRequest.domain.name = 'UnknownDomain'
      const res = await queryDomainEndpoint(badRequest, SignerEndpoint.DISABLE_DOMAIN)
      expect(res.status).toBe(400)
      const resBody: DisableDomainResponseFailure = await res.json()
      expect(resBody).toStrictEqual<DisableDomainResponseFailure>({
        success: false,
        version: resBody.version,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 400 on bad encoding', async () => {
      const badRequest = await disableRequest(wallet, ACCOUNT_ADDRESS1, disableSalt)
      // @ts-ignore Intentionally not JSON
      badRequest.domain = 'Freddy'
      const res = await queryDomainEndpoint(badRequest, SignerEndpoint.DISABLE_DOMAIN)
      expect(res.status).toBe(400)
      const resBody: DisableDomainResponseFailure = await res.json()
      expect(resBody).toStrictEqual<DisableDomainResponseFailure>({
        success: false,
        version: resBody.version,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 401 on failed auth', async () => {
      const badRequest = await disableRequest(wallet, ACCOUNT_ADDRESS1, disableSalt)
      badRequest.domain.salt = defined('badSalt')
      const res = await queryDomainEndpoint(badRequest, SignerEndpoint.DISABLE_DOMAIN)
      expect(res.status).toBe(401)
      const resBody: DisableDomainResponseFailure = await res.json()
      expect(resBody).toStrictEqual<DisableDomainResponseFailure>({
        success: false,
        version: resBody.version,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })
  })

  describe(`${SignerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
    // This request gets repeated over time
    it('Should respond with 200 on valid request', async () => {
      const req = await quotaRequest(wallet, ACCOUNT_ADDRESS1, quotaSalt)
      const res = await queryDomainEndpoint(req, SignerEndpoint.DOMAIN_QUOTA_STATUS)
      expect(res.status).toBe(200)
      const resBody: DomainQuotaStatusResponseSuccess = await res.json()
      expect(resBody).toStrictEqual<DomainQuotaStatusResponseSuccess>({
        success: true,
        version: expectedVersion,
        status: { disabled: false, counter: 0, timer: 0, now: resBody.status.now },
      })
    })

    it('Should respond with 200 on valid request for disabled domain', async () => {
      const req = await quotaRequest(wallet, ACCOUNT_ADDRESS1, disableSalt)
      const res = await queryDomainEndpoint(req, SignerEndpoint.DOMAIN_QUOTA_STATUS)
      expect(res.status).toBe(200)
      const resBody: DomainQuotaStatusResponseSuccess = await res.json()
      expect(resBody).toStrictEqual<DomainQuotaStatusResponseSuccess>({
        success: true,
        version: expectedVersion,
        status: { disabled: true, counter: 0, timer: 0, now: resBody.status.now },
      })
    })

    it('Should respond with 400 on missing request fields', async () => {
      const badRequest = await quotaRequest(wallet, ACCOUNT_ADDRESS1, quotaSalt)
      // @ts-ignore Intentionally deleting required field
      delete badRequest.domain.version
      const res = await queryDomainEndpoint(badRequest, SignerEndpoint.DOMAIN_QUOTA_STATUS)
      expect(res.status).toBe(400)
      const resBody: DomainQuotaStatusResponseFailure = await res.json()
      expect(resBody).toStrictEqual<DomainQuotaStatusResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 400 on unknown domain', async () => {
      const badRequest = await quotaRequest(wallet, ACCOUNT_ADDRESS1, quotaSalt)
      // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
      badRequest.domain.name = 'UnknownDomain'
      const res = await queryDomainEndpoint(badRequest, SignerEndpoint.DOMAIN_QUOTA_STATUS)
      expect(res.status).toBe(400)
      const resBody: DomainQuotaStatusResponseFailure = await res.json()
      expect(resBody).toStrictEqual<DomainQuotaStatusResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 400 on bad encoding', async () => {
      const badRequest = await quotaRequest(wallet, ACCOUNT_ADDRESS1, quotaSalt)
      // @ts-ignore Intentionally not JSON
      badRequest.domain = 'Freddy'
      const res = await queryDomainEndpoint(badRequest, SignerEndpoint.DOMAIN_QUOTA_STATUS)
      expect(res.status).toBe(400)
      const resBody: DomainQuotaStatusResponseFailure = await res.json()
      expect(resBody).toStrictEqual<DomainQuotaStatusResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 401 on failed auth', async () => {
      const badRequest = await quotaRequest(wallet, ACCOUNT_ADDRESS1, quotaSalt)
      badRequest.domain.salt = defined('badSalt')
      const res = await queryDomainEndpoint(badRequest, SignerEndpoint.DOMAIN_QUOTA_STATUS)
      expect(res.status).toBe(401)
      const resBody: DomainQuotaStatusResponseFailure = await res.json()
      expect(resBody).toStrictEqual<DomainQuotaStatusResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })
  })

  describe(`${SignerEndpoint.DOMAIN_SIGN}`, () => {
    const signSaltNew = `${signSalt}-${Date.now()}`
    let req: DomainRestrictedSignatureRequest
    let _: ThresholdPoprfClient
    beforeAll(async () => {
      ;[req, _] = await signatureRequest(wallet, ACCOUNT_ADDRESS1, signSaltNew)
      console.log(_) // TODO Until this is used for evaluation
    })
    it('Should respond with 200 on valid request for new domain', async () => {
      const res = await queryDomainEndpoint(req, SignerEndpoint.DOMAIN_SIGN)
      expect(res.status).toBe(200)
      const resBody: DomainRestrictedSignatureResponseSuccess = await res.json()
      console.log(resBody)
      expect(resBody).toStrictEqual<DomainRestrictedSignatureResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: resBody.signature,
        status: {
          disabled: false,
          counter: 1,
          timer: resBody.status.timer,
          now: resBody.status.now,
        },
      })
      // TODO(ODIS 2.0.0 e2e fix) verify partial signature
    })

    it('Should respond with 200 repeated valid requests with nonce updated', async () => {
      // submit identical request with nonce set to 1
      req.options.nonce = defined(1)
      req.options.signature = noString
      req.options.signature = defined(
        await wallet.signTypedData(ACCOUNT_ADDRESS1, domainRestrictedSignatureRequestEIP712(req))
      )

      // TODO(ODIS 2.0.0 e2e fix) clean up this duplicated logic
      const headers: any = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'ignore',
      }
      const res = await fetch(ODIS_SIGNER_URL + SignerEndpoint.DOMAIN_SIGN, {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
      })
      expect(res.status).toBe(200)
      const resBody: DomainRestrictedSignatureResponseSuccess = await res.json()
      console.log(resBody)
      expect(resBody).toStrictEqual<DomainRestrictedSignatureResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: resBody.signature,
        status: {
          disabled: false,
          counter: 2,
          timer: resBody.status.timer,
          now: resBody.status.now,
        },
      })
      // TODO(ODIS 2.0.0 e2e fix) verify partial signature
    })

    it('Should respond with 200 if nonce > domainState', async () => {
      const [newReq, _] = await signatureRequest(
        wallet,
        ACCOUNT_ADDRESS1,
        `${signSalt}-${Date.now() + 1}`,
        undefined,
        5
      )
      const res = await queryDomainEndpoint(newReq, SignerEndpoint.DOMAIN_SIGN)
      expect(res.status).toBe(200)
      const resBody: DomainRestrictedSignatureResponseSuccess = await res.json()
      console.log(resBody)
      expect(resBody).toStrictEqual<DomainRestrictedSignatureResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: resBody.signature,
        status: {
          disabled: false,
          counter: 1, // counter gets incremented, not set to nonce value
          timer: resBody.status.timer,
          now: resBody.status.now,
        },
      })
      // TODO(ODIS 2.0.0 e2e fix) verify partial signature
    })
    // TODO(ODIS 2.0.0 e2e fix) add 401 authentication tests, invalid nonce, & bad input
  })
})

async function queryDomainEndpoint(
  req: DomainRequest,
  endpoint: DomainEndpoint,
  keyVersion?: string
): Promise<Response> {
  const body = JSON.stringify(req)
  const headers: any = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'ignore',
  }

  if (keyVersion !== undefined) {
    headers[KEY_VERSION_HEADER] = keyVersion
  }

  const res = await fetch(ODIS_SIGNER_URL + endpoint, {
    method: 'POST',
    headers,
    body,
  })
  return res
}

// TODO(ODIS 2.0.0 e2e fix) clean up duplicate code
const domainStages = (): SequentialDelayStage[] => [
  { delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) },
]

const authenticatedDomain = (
  address: string,
  salt: string,
  _stages?: SequentialDelayStage[]
): SequentialDelayDomain => ({
  name: DomainIdentifiers.SequentialDelay,
  version: '1',
  stages: _stages ?? domainStages(),
  address: defined(address),
  salt: defined(salt),
})

const quotaRequest = async (
  wallet: LocalWallet,
  address: string,
  salt: string
): Promise<DomainQuotaStatusRequest<SequentialDelayDomain>> => {
  const req: DomainQuotaStatusRequest<SequentialDelayDomain> = {
    type: DomainRequestTypeTag.QUOTA,
    domain: authenticatedDomain(address, salt),
    options: {
      signature: noString,
      nonce: noNumber,
    },
    sessionID: defined(genSessionID()),
  }
  req.options.signature = defined(
    await wallet.signTypedData(address, domainQuotaStatusRequestEIP712(req))
  )
  return req
}

const disableRequest = async (
  wallet: LocalWallet,
  address: string,
  salt: string
): Promise<DisableDomainRequest<SequentialDelayDomain>> => {
  const req: DisableDomainRequest<SequentialDelayDomain> = {
    type: DomainRequestTypeTag.DISABLE,
    domain: authenticatedDomain(address, salt),
    options: {
      signature: noString,
      nonce: noNumber,
    },
    sessionID: defined(genSessionID()),
  }
  req.options.signature = defined(
    await wallet.signTypedData(address, disableDomainRequestEIP712(req))
  )
  return req
}

const signatureRequest = async (
  wallet: LocalWallet,
  address: string,
  salt: string,
  _domain?: SequentialDelayDomain,
  _nonce?: number
): Promise<[DomainRestrictedSignatureRequest<SequentialDelayDomain>, ThresholdPoprfClient]> => {
  const domain = _domain ?? authenticatedDomain(address, salt)
  const thresholdPoprfClient = new ThresholdPoprfClient(
    Buffer.from(ODIS_DOMAINS_PUBLIC_PUBKEY, 'base64'),
    Buffer.from(ODIS_DOMAINS_PUBLIC_POLYNOMIAL, 'hex'),
    domainHash(domain),
    Buffer.from('test message', 'utf8')
  )

  const req: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
    type: DomainRequestTypeTag.SIGN,
    domain: domain,
    options: {
      signature: noString,
      nonce: defined(_nonce ?? 0),
    },
    blindedMessage: thresholdPoprfClient.blindedMessage.toString('base64'),
    sessionID: defined(genSessionID()),
  }
  req.options.signature = defined(
    await wallet.signTypedData(address, domainRestrictedSignatureRequestEIP712(req))
  )
  return [req, thresholdPoprfClient]
}

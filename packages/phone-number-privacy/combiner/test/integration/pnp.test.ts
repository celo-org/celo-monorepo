import { StableToken } from '@celo/contractkit'
import { CombinerEndpoint, TestUtils } from '@celo/phone-number-privacy-common'
import {
  initDatabase as initSignerDatabase,
  initKeyProvider,
  startSigner,
  SupportedDatabase,
  SupportedKeystore,
} from '@celo/phone-number-privacy-signer'
import { SignerConfig } from '@celo/phone-number-privacy-signer/dist/config'
import { KeyProvider } from '@celo/phone-number-privacy-signer/dist/key-management/key-provider-base'
import BigNumber from 'bignumber.js'
import threshold_bls from 'blind-threshold-bls'
import { Server as HttpsServer } from 'https'
import { Knex } from 'knex'
import { Server } from 'net'
import request from 'supertest'
import config, { CombinerConfig } from '../../src/config'
import { startCombiner } from '../../src/server'

const {
  ContractRetrieval,
  createMockContractKit,
  createMockOdisPayments,
  createMockWeb3,
  // getPnpQuotaRequest,
  // TODO EN: rename this to getPnpRequestAuthorization probably
  createMockAccounts,
  createMockToken,
  getPnpQuotaRequestAuthorization,
} = TestUtils.Utils
const { PRIVATE_KEY1, ACCOUNT_ADDRESS1, mockAccount } = TestUtils.Values

const combinerConfig: CombinerConfig = { ...config }

const signerConfig: SignerConfig = {
  serviceName: 'odis-signer',
  server: {
    port: undefined,
    sslKeyPath: undefined,
    sslCertPath: undefined,
  },
  quota: {
    unverifiedQueryMax: 10,
    additionalVerifiedQueryMax: 30,
    queryPerTransaction: 2,
    // Min balance is .01 cUSD
    minDollarBalance: new BigNumber(1e16),
    // Min balance is .01 cEUR
    minEuroBalance: new BigNumber(1e16),
    // Min balance is .005 CELO
    minCeloBalance: new BigNumber(5e15),
    // Equivalent to 0.1 cUSD/query
    queryPriceInCUSD: new BigNumber(0.1),
  },
  api: {
    domains: {
      enabled: false,
    },
    phoneNumberPrivacy: {
      enabled: true,
    },
  },
  attestations: {
    numberAttestationsRequired: 3,
  },
  blockchain: {
    provider: 'https://alfajores-forno.celo-testnet.org',
    apiKey: undefined,
  },
  db: {
    type: SupportedDatabase.Sqlite,
    user: '',
    password: '',
    database: '',
    host: 'http://localhost',
    port: undefined,
    ssl: true,
    poolMaxSize: 50,
  },
  keystore: {
    type: SupportedKeystore.MOCK_SECRET_MANAGER,
    keys: {
      phoneNumberPrivacy: {
        name: 'phoneNumberPrivacy',
        latest: 2,
      },
      domains: {
        name: 'domains',
        latest: 1,
      },
    },
    azure: {
      clientID: '',
      clientSecret: '',
      tenant: '',
      vaultName: '',
      secretName: '',
    },
    google: {
      projectId: '',
      secretName: '',
      secretVersion: 'latest',
    },
    aws: {
      region: '',
      secretName: '',
      secretKey: '',
    },
  },
  timeout: 5000,
  test_quota_bypass_percentage: 0,
}

const testBlockNumber = 1000000

const mockOdisPaymentsTotalPaidCUSD = jest.fn<BigNumber, []>()
const mockBalanceOfCUSD = jest.fn<BigNumber, []>()
const mockBalanceOfCEUR = jest.fn<BigNumber, []>()
const mockBalanceOfCELO = jest.fn<BigNumber, []>()

const mockContractKit = createMockContractKit(
  {
    [ContractRetrieval.getOdisPayments]: createMockOdisPayments(mockOdisPaymentsTotalPaidCUSD),
    // TODO EN: fix account stuff
    [ContractRetrieval.getAccounts]: createMockAccounts(mockAccount),
    [ContractRetrieval.getStableToken]: jest.fn(),
    [ContractRetrieval.getGoldToken]: createMockToken(mockBalanceOfCELO),
  },
  createMockWeb3(5, testBlockNumber)
)
jest.mock('../../src/common/web3/contracts', () => ({
  ...jest.requireActual('../../src/common/web3/contracts'),
  getContractKit: jest.fn().mockImplementation(() => {
    console.log('from inside of getContractKit')
    return mockContractKit
  }),
}))

mockContractKit.contracts[ContractRetrieval.getStableToken] = jest.fn(
  (stableToken: StableToken) => {
    switch (stableToken) {
      case StableToken.cUSD:
        return createMockToken(mockBalanceOfCUSD)
      case StableToken.cEUR:
        return createMockToken(mockBalanceOfCEUR)
      default:
        return createMockToken(jest.fn().mockReturnValue(new BigNumber(0)))
    }
  }
)

describe('pnpService', () => {
  let keyProvider1: KeyProvider
  let keyProvider2: KeyProvider
  let keyProvider3: KeyProvider
  let signerDB1: Knex
  let signerDB2: Knex
  let signerDB3: Knex
  let signer1: Server | HttpsServer
  let signer2: Server | HttpsServer
  let signer3: Server | HttpsServer
  let app: any

  const signerMigrationsPath = '../signer/src/common/database/migrations'

  beforeAll(async () => {
    keyProvider1 = await initKeyProvider(signerConfig)
    keyProvider2 = await initKeyProvider(signerConfig)
    keyProvider3 = await initKeyProvider(signerConfig)

    app = startCombiner(combinerConfig)
  })

  beforeEach(async () => {
    config.phoneNumberPrivacy.enabled = true

    signerDB1 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB2 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB3 = await initSignerDatabase(signerConfig, signerMigrationsPath)

    signer1 = startSigner(signerConfig, signerDB1, keyProvider1).listen(3001)
    signer2 = startSigner(signerConfig, signerDB2, keyProvider2).listen(3002)
    signer3 = startSigner(signerConfig, signerDB3, keyProvider3).listen(3003)
  })

  afterEach(async () => {
    await signerDB1?.destroy()
    await signerDB2?.destroy()
    await signerDB3?.destroy()
    signer1?.close()
    signer2?.close()
    signer3?.close()
  })

  describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
    const onChainBalance = new BigNumber(1e18)

    beforeEach(() => {
      mockOdisPaymentsTotalPaidCUSD.mockReturnValue(onChainBalance)
    })

    it('should [TODO EN]', async () => {
      const message = Buffer.from('test message')

      const userSeed = new Uint8Array(32)
      for (let i = 0; i < userSeed.length - 1; i++) {
        userSeed[i] = i
      }

      const blindedMsgResult = threshold_bls.blind(message, userSeed)
      const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

      const req = {
        account: ACCOUNT_ADDRESS1,
        blindedQueryPhoneNumber: blindedMsg,
      }
      const authorization = getPnpQuotaRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)
      const res = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)

      // console.log(res)
      expect.assertions(1)
      console.log('res.body:', res.body)
      expect(res.status).toBe(200)
    })
  })

  /*

  TODO(Alec): check code coverage

  [ ] Add TODOs for all ODIS tests that remain to be written
[ ] Bad signature (combiner + signer)
[ ] Bad encoding (combiner + signer)
[ ] Undefined domain (combiner + signer)
[ ] Extra fields? -> should reject / use t.strict (combiner + signer)
[ ] Valid key versions (combiner + signer)
[ ] Invalid key versions (combiner + signer)
[ ] Out of quota (combiner + signer)
[ ] Bad nonce (combiner + signer)
[ ] Request too early for rate limiting (both)
  */
})

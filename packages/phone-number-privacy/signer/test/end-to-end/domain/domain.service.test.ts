import {
  Endpoints,
  Domain,
  DomainOptions,
  SequentialDelayDomain,
} from '@celo/phone-number-privacy-common'
import 'isomorphic-fetch'
import { defined, noBool, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { ACCOUNT_ADDRESS2 } from '@celo/wallet-rpc/lib/rpc-wallet.test'
import { contractKit } from '../../../../combiner/test/end-to-end/resources'

const ODIS_SIGNER = process.env.ODIS_SIGNER_SERVICE_URL
describe('Domain Service tests', () => {
  describe('Disable domain tests', () => {
    it('Should answer 404 for unknown domain', async () => {
      const seqDomain: Domain = {
        name: 'wrong domain',
        version: '1',
      }
      const options: DomainOptions = {}
      const response = await postDisableMessage(seqDomain, options)
      expect(response.status).toBe(404)
    })

    it('Should answer 200 for known domain', async () => {
      const authenticatedDomain: SequentialDelayDomain = {
        name: 'ODIS Sequential Delay Domain',
        version: '1',
        stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
        address: defined(ACCOUNT_ADDRESS2),
        salt: noString,
      }
      const signature = await contractKit.connection.sign(
        JSON.stringify(authenticatedDomain),
        ACCOUNT_ADDRESS2
      )
      const options = {
        signature: defined(signature),
        nonce: defined(0),
      }
      const response = await postDisableMessage(authenticatedDomain, options)
      expect(response.status).toBe(200)
    })

    it('Should answer 200 for multiple requests', async () => {
      const authenticatedDomain: SequentialDelayDomain = {
        name: 'ODIS Sequential Delay Domain',
        version: '1',
        stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
        address: defined(ACCOUNT_ADDRESS2),
        salt: noString,
      }
      const signature = await contractKit.connection.sign(
        JSON.stringify(authenticatedDomain),
        ACCOUNT_ADDRESS2
      )
      const options = {
        signature: defined(signature),
        nonce: defined(0),
      }
      const response = await postDisableMessage(authenticatedDomain, options)
      expect(response.status).toBe(200)

      const response2 = await postDisableMessage(authenticatedDomain, options)
      expect(response2.status).toBe(200)
    })

    async function postDisableMessage(domain: Domain, options: DomainOptions): Promise<Response> {
      const body = JSON.stringify({
        domain,
        options,
      })

      const res = await fetch(ODIS_SIGNER + Endpoints.DISABLE_DOMAIN, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'ignore',
        },
        body,
      })
      return res
    }
  })
})

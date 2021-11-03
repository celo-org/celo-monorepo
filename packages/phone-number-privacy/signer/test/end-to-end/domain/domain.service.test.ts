import { Domain, SequentialDelayDomain } from '@celo/identity/lib/odis/domains'
import { Endpoints } from '../../../src/server'
import 'isomorphic-fetch'
import { LocalWallet } from '@celo/wallet-local'
import { defined, noBool, noString } from '@celo/utils/lib/sign-typed-data-utils'

const ODIS_SIGNER = process.env.ODIS_SIGNER_SERVICE_URL
describe('Domain Service tests', () => {
  const wallet = new LocalWallet()
  wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
  wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000bad516e9')
  const walletAddress = wallet.getAccounts()[0]!

  describe('Disable domain tests', () => {
    it('Should answer 404 for unknown domain', async () => {
      const seqDomain: Domain = {
        name: 'wrong domain',
        version: '1',
      }
      const response = await postDisableMessage(seqDomain)
      expect(response.status).toBe(404)
    })

    it('Should answer 200 for known', async () => {
      const authenticatedDomain: SequentialDelayDomain = {
        name: 'ODIS Sequential Delay Domain',
        version: '1',
        stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
        address: defined(walletAddress),
        salt: noString,
      }
      const response = await postDisableMessage(authenticatedDomain)
      expect(response.status).toBe(200)
    })

    it('Should answer 200 for multiple requests', async () => {
      const authenticatedDomain: SequentialDelayDomain = {
        name: 'ODIS Sequential Delay Domain',
        version: '1',
        stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
        address: defined(walletAddress),
        salt: noString,
      }
      const response = await postDisableMessage(authenticatedDomain)
      expect(response.status).toBe(200)

      const response2 = await postDisableMessage(authenticatedDomain)
      expect(response2.status).toBe(200)
    })

    async function postDisableMessage(domain: Domain): Promise<Response> {
      const body = JSON.stringify({
        domain,
      })

      const res = await fetch(ODIS_SIGNER + Endpoints.DISABLE_DOMAIN, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'ignore', //TODO: Changed once auth is added to domains
        },
        body,
      })
      return res
    }
  })
})

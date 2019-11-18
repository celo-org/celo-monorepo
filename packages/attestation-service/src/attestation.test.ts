import { newKitFromWeb3 } from '@celo/contractkit'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { ACCOUNT_ADDRESSES } from '@celo/dev-utils/lib/ganache-setup'
import { mineBlocks, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { join } from 'path'
import { Sequelize } from 'sequelize'
import UmZug from 'umzug'
import { validateAttestationRequest } from './attestation'
import { initializeDB, sequelize, setKit } from './db'

testWithGanache('attestation', (web3) => {
  const phoneNumber: string = '+18005551212'
  const caller: string = ACCOUNT_ADDRESSES[0]

  const callerKit = newKitFromWeb3(web3)
  callerKit.defaultAccount = caller
  let attestations: AttestationsWrapper
  let issuer: string

  beforeAll(async () => {
    setKit(newKitFromWeb3(web3))
    attestations = await callerKit.contracts.getAttestations()
    await initializeDB('sqlite://db/test.db')
    const umzug = new UmZug({
      storage: 'sequelize',

      storageOptions: {
        sequelize: sequelize!,
      },

      migrations: {
        params: [sequelize!.getQueryInterface(), Sequelize],
        path: join(__dirname, '../migrations'),
      },
    })
    await umzug.up()

    process.env.ACCOUNT_ADDRESS = caller
  })

  describe('without a valid attestation request', () => {
    it('should return a 422', async () => {
      await expect(
        validateAttestationRequest({ phoneNumber, account: caller, issuer: caller })
      ).rejects.toThrow()
    })
  })

  describe('with a valid attestation request', () => {
    beforeEach(async () => {
      console.log('approve')
      await attestations.approveAttestationFee(1).then((tx) => tx.sendAndWaitForReceipt())
      console.log('request')
      await attestations.request(phoneNumber, 1).then((tx) => tx.sendAndWaitForReceipt())

      await mineBlocks(await attestations.selectIssuersWaitBlocks(), web3)

      await attestations.selectIssuers(phoneNumber).then((tx) => tx.sendAndWaitForReceipt())

      console.log(await attestations.getAttestationIssuers(phoneNumber, caller))
      issuer = (await attestations.getAttestationIssuers(phoneNumber, caller))[0]
    })

    it('validates', async () => {
      console.log(await attestations.getAttestationIssuers(phoneNumber, caller))
      await validateAttestationRequest({ phoneNumber, account: caller, issuer })
    })
  })
})

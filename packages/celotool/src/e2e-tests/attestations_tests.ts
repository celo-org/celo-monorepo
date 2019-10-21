import { ContractKit, newKit } from '@celo/contractkit'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { assert } from 'chai'
import { getContext, GethTestConfig, sleep } from './utils'

const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
const phoneNumber = '+15555555555'

describe('governance tests', () => {
  const gethConfig: GethTestConfig = {
    migrate: true,
    instances: [
      { name: 'validator0', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
      { name: 'validator1', validating: true, syncmode: 'full', port: 30305, rpcport: 8547 },
      { name: 'validator2', validating: true, syncmode: 'full', port: 30307, rpcport: 8549 },
      { name: 'validator3', validating: true, syncmode: 'full', port: 30309, rpcport: 8551 },
      { name: 'validator4', validating: true, syncmode: 'full', port: 30311, rpcport: 8553 },
    ],
  }

  const context: any = getContext(gethConfig)
  let contractKit: ContractKit
  let Attestations: AttestationsWrapper

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(context.hooks.after)

  const restart = async () => {
    await context.hooks.restart()
    contractKit = newKit('http://localhost:8545')
    contractKit.defaultAccount = validatorAddress

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    // Assuming empty password
    await contractKit.web3.eth.personal.unlockAccount(validatorAddress, '', 1000000)
    Attestations = await contractKit.contracts.getAttestations()
  }

  describe('Attestations', () => {
    before(async function() {
      this.timeout(0)
      await restart()
    })

    it('requests an attestation', async function(this: any) {
      this.timeout(10000)
      const approve = await Attestations.approveAttestationFee(2)
      await approve.sendAndWaitForReceipt()
      const request = await Attestations.request(phoneNumber, 2)
      await request.sendAndWaitForReceipt()

      const stats = await Attestations.getAttestationStat(phoneNumber, validatorAddress)
      assert.equal(stats.total, 2)
      const actionable = await Attestations.getActionableAttestations(phoneNumber, validatorAddress)
      assert.lengthOf(actionable, 2)
    })
  })
})

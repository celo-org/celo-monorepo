import _ from 'lodash'
import { MultiSigContract, MultiSigInstance } from 'types'

const MultiSig: MultiSigContract = artifacts.require('MultiSig')

// TODO(asa): Test more governance configurations, calling functions on external contracts.
contract('MultiSig', (accounts: any) => {
  let multiSig: MultiSigInstance

  const owners = [accounts[0], accounts[1]]
  const requiredSignatures = 2
  const internalRequiredSignatures = 2

  beforeEach(async () => {
    multiSig = await MultiSig.new(true)
    await multiSig.initialize(owners, requiredSignatures, internalRequiredSignatures)
  })

  describe('#getOwners()', () => {
    it('should return the owners', async () => {
      assert.deepEqual(await multiSig.getOwners(), owners)
    })
  })

  describe('#getConfirmations()', () => {
    let txId: number
    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      const txData = multiSig.contract.methods.addOwner(accounts[2]).encodeABI()
      const tx = await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })
      // @ts-ignore: TODO(mcortesi): fix typings
      const txEvent = _.find(tx.logs, {
        event: 'Confirmation',
      })
      // @ts-ignore: TODO(mcortesi): fix typings
      txId = txEvent.args.transactionId
    })

    it('should return the confirmations', async () => {
      assert.deepEqual(await multiSig.getConfirmations(txId), [accounts[0]])
    })
  })

  describe('#getTransactionIds()', () => {
    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      const txData = multiSig.contract.methods.addOwner(accounts[2]).encodeABI()
      await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })
    })

    it('should return the confirmations', async () => {
      const txIds = (await multiSig.getTransactionIds(0, 1, true, true)).map((x) => x.toNumber())
      assert.deepEqual(txIds, [0])
    })
  })
})

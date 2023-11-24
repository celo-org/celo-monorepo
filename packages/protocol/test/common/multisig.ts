import { assertEqualBN, assertTransactionRevertWithReason } from '@celo/protocol/lib/test-utils'
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

  describe('#changeRequirement()', () => {
    it('should allow the requirement to be changed via the MultiSig', async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      const txData = multiSig.contract.methods.changeRequirement(1).encodeABI()
      const tx = await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })
      // @ts-ignore: TODO(mcortesi): fix typings
      const txEvent = _.find(tx.logs, {
        event: 'Confirmation',
      })
      // @ts-ignore: TODO(mcortesi): fix typings
      const txId = txEvent.args.transactionId

      // @ts-ignore: TODO(mcortesi): fix typings
      await multiSig.confirmTransaction(txId, { from: accounts[1] })
      assertEqualBN(await multiSig.required(), 1)
    })

    it('should not allow an external account to change the requirement', async () => {
      // @ts-ignore
      await assertTransactionRevertWithReason(
        multiSig.changeRequirement(3, { from: accounts[3] }),
        'msg.sender was not multisig wallet'
      )
    })
  })

  describe('#changeInternalRequirement()', () => {
    it('should allow the internal requirement to be changed via the MultiSig', async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      const txData = multiSig.contract.methods.changeInternalRequirement(1).encodeABI()
      const tx = await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })
      // @ts-ignore: TODO(mcortesi): fix typings
      const txEvent = _.find(tx.logs, {
        event: 'Confirmation',
      })
      // @ts-ignore: TODO(mcortesi): fix typings
      const txId = txEvent.args.transactionId

      // @ts-ignore: TODO(mcortesi): fix typings
      await multiSig.confirmTransaction(txId, { from: accounts[1] })
      assertEqualBN(await multiSig.internalRequired(), 1)
    })

    it('should not allow an external account to change the internal requirement', async () => {
      // @ts-ignore
      await assertTransactionRevertWithReason(
        multiSig.changeInternalRequirement(3, { from: accounts[3] }),
        'msg.sender was not multisig wallet'
      )
    })
  })

  describe('#getConfirmationCount()', () => {
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

    it('should return the confirmation count', async () => {
      assertEqualBN(await multiSig.getConfirmationCount(txId), 1)
    })
  })

  describe('#getTransactionCount()', () => {
    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      const txData = multiSig.contract.methods.addOwner(accounts[2]).encodeABI()
      await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })
    })

    it('should return the transaction count', async () => {
      assertEqualBN(await multiSig.getTransactionCount(true, true), 1)
    })
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

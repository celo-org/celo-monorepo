import { assertRevert, NULL_ADDRESS } from '@celo/protocol/lib/test-utils'
import { parseMultiSigTransaction } from '@celo/protocol/lib/web3-utils'
import * as _ from 'lodash'
import { MultiSigContract, MultiSigInstance } from 'types'

const MultiSig: MultiSigContract = artifacts.require('MultiSig')

const encodeAddOwnerFunc = (web3, ownerAddress) => {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: 'addOwner',
      type: 'function',
      inputs: [{ name: 'owner', type: 'address' }],
    },
    [ownerAddress]
  )
}

const encodeRemoveOwnerFunc = (web3, ownerAddress) => {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: 'removeOwner',
      type: 'function',
      inputs: [{ name: 'owner', type: 'address' }],
    },
    [ownerAddress]
  )
}

const encodeReplaceOwnerFunc = (web3, oldOwner, newOwner) => {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: 'replaceOwner',
      type: 'function',
      inputs: [{ name: 'owner', type: 'address' }, { name: 'newOwner', type: 'address' }],
    },
    [oldOwner, newOwner]
  )
}

const encodeChangeRequirementFunc = (web3, required) => {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: 'changeRequirement',
      type: 'function',
      inputs: [{ name: '_required', type: 'uint256' }],
    },
    [required]
  )
}

// TODO(asa): Test more governance configurations, calling functions on external contracts.
contract('MultiSig', (accounts: any) => {
  let multiSig: MultiSigInstance

  const owners = [accounts[0], accounts[1]]
  const requiredSignatures = 2

  beforeEach(async () => {
    multiSig = await MultiSig.new()
    await multiSig.initialize(owners, requiredSignatures)
  })

  describe('#initialize()', () => {
    it('should have set the owners', async () => {
      assert.deepEqual(await multiSig.getOwners(), owners)
    })

    it('should have set the number of required signatures', async () => {
      const required: number = (await multiSig.required()).toNumber()
      assert.equal(required, requiredSignatures)
    })

    it('should not be callable again', async () => {
      await assertRevert(multiSig.initialize(owners, requiredSignatures))
    })
  })

  describe('#submitTransaction()', () => {
    let txData: string
    beforeEach(async () => {
      txData = encodeAddOwnerFunc(web3, accounts[2])
    })

    it('should allow an owner to submit a transaction', async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      const tx = await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })

      const txEvent = _.find(tx.logs, {
        event: 'Confirmation',
      })
      const txId = txEvent.args.transactionId

      // @ts-ignore: TODO(mcortesi): fix typings
      const parsedTxData = parseMultiSigTransaction(await multiSig.transactions(txId))
      assert.equal(parsedTxData.destination, multiSig.address)
      assert.equal(parsedTxData.value, 0)
      assert.equal(parsedTxData.data, txData)
      assert.isFalse(parsedTxData.executed)
      assert.isTrue(await multiSig.confirmations(txId, accounts[0]))
      assert.equal((await multiSig.transactionCount()).toNumber(), 1)
    })

    it('should not allow an owner to submit a transaction to a null address', async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      await assertRevert(multiSig.submitTransaction(NULL_ADDRESS, 0, txData))
    })

    it('should not allow an owner to submit a transaction', async () => {
      await assertRevert(
        // @ts-ignore: TODO(mcortesi): fix typings
        multiSig.submitTransaction(multiSig.address, 0, txData, { from: accounts[2] })
      )
    })
  })

  describe('#confirmTransaction()', () => {
    let txId: number
    let tx: string
    beforeEach(async () => {
      const txData = encodeAddOwnerFunc(web3, accounts[2])
      // @ts-ignore: TODO(mcortesi): fix typings
      tx = await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })

      // @ts-ignore: TODO(mcortesi): fix typings
      const txEvent = _.find(tx.logs, {
        event: 'Confirmation',
      })
      txId = txEvent.args.transactionId
    })

    it('should allow an owner to confirm a transaction', async () => {
      await multiSig.confirmTransaction(txId, { from: accounts[1] })
      assert.isTrue(await multiSig.confirmations(txId, accounts[1]))

      // @ts-ignore: TODO(mcortesi): fix typings
      const parsedTxData = parseMultiSigTransaction(await multiSig.transactions(txId))
      assert.isTrue(parsedTxData.executed)
    })

    it('should not allow an owner to confirm a transaction twice', async () => {
      await assertRevert(multiSig.confirmTransaction(txId, { from: accounts[0] }))
    })

    it('should not allow a non-owner to confirm a transaction', async () => {
      await assertRevert(multiSig.confirmTransaction(txId, { from: accounts[2] }))
    })
  })

  describe('#revokeConfirmation()', () => {
    let txId: number
    let tx: string
    beforeEach(async () => {
      const txData = encodeAddOwnerFunc(web3, accounts[2])
      // @ts-ignore: TODO(mcortesi): fix typings
      tx = await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })

      // @ts-ignore: TODO(mcortesi): fix typings
      const txEvent = _.find(tx.logs, {
        event: 'Confirmation',
      })
      txId = txEvent.args.transactionId
    })

    it('should allow an owner to revoke a confirmation', async () => {
      await multiSig.revokeConfirmation(txId)
      assert.isFalse(await multiSig.confirmations(txId, accounts[0]))
    })

    it('should not allow a non-owner to revoke a confirmation', async () => {
      await assertRevert(multiSig.revokeConfirmation(txId, { from: accounts[2] }))
    })

    it('should not allow an owner to revoke before confirming', async () => {
      await assertRevert(multiSig.revokeConfirmation(txId, { from: accounts[1] }))
    })
  })

  describe('#addOwner()', () => {
    it('should allow a new owner to be added via the MultiSig', async () => {
      const txData = encodeAddOwnerFunc(web3, accounts[2])
      // @ts-ignore: TODO(mcortesi): fix typings
      const tx = await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })

      // @ts-ignore: TODO(mcortesi): fix typings
      const txEvent = _.find(tx.logs, {
        event: 'Confirmation',
      })
      const txId = txEvent.args.transactionId
      // @ts-ignore: TODO(mcortesi): fix typings
      await multiSig.confirmTransaction(txId, { from: accounts[1] })
      assert.isTrue(await multiSig.isOwner(accounts[2]))
    })

    it('should not allow an external account to add an owner', async () => {
      await assertRevert(multiSig.addOwner(accounts[3]))
    })

    it('should not allow adding the null address', async () => {
      await assertRevert(multiSig.addOwner(NULL_ADDRESS))
    })
  })

  describe('#removeOwner()', () => {
    it('should allow an owner to be removed via the MultiSig', async () => {
      // @ts-ignore contract is a property
      const txData = encodeRemoveOwnerFunc(web3, accounts[1])
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

      assert.isFalse(await multiSig.isOwner(accounts[1]))
      assert.equal((await multiSig.required()).toNumber(), 1)
    })

    it('should not allow an external account to remove an owner', async () => {
      await assertRevert(multiSig.removeOwner(accounts[1]))
    })
  })

  describe('#replaceOwner()', () => {
    it('should allow an existing owner to be replaced by a new one via the MultiSig', async () => {
      // @ts-ignore contract is a property
      const txData = encodeReplaceOwnerFunc(web3, accounts[1], accounts[2])
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
      assert.isTrue(await multiSig.isOwner(accounts[2]))
      assert.isFalse(await multiSig.isOwner(accounts[1]))
    })

    it('should not allow an external account to replace an owner', async () => {
      await assertRevert(multiSig.replaceOwner(accounts[1], accounts[2]))
    })

    it('should not allow an owner to be replaced by the null address', async () => {
      await assertRevert(multiSig.replaceOwner(accounts[1], NULL_ADDRESS))
    })
  })

  describe('#changeRequirement()', () => {
    it('should allow the requirement to be changed via the MultiSig', async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      const txData = encodeChangeRequirementFunc(web3, 1)
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
      assert.equal((await multiSig.required()).toNumber(), 1)
    })

    it('should not allow an external account to change the requirement', async () => {
      await assertRevert(multiSig.changeRequirement(1))
    })
  })

  describe('#getConfirmationCount()', () => {
    let txId: number
    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      const txData = encodeAddOwnerFunc(web3, accounts[2])
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
      assert.equal((await multiSig.getConfirmationCount(txId)).toNumber(), 1)
    })
  })

  describe('#getTransactionCount()', () => {
    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi): fix typings
      const txData = encodeAddOwnerFunc(web3, accounts[2])
      await multiSig.submitTransaction(multiSig.address, 0, txData, {
        from: accounts[0],
      })
    })

    it('should return the transaction count', async () => {
      assert.equal((await multiSig.getTransactionCount(true, true)).toNumber(), 1)
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
      const txData = encodeAddOwnerFunc(web3, accounts[2])
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
      const txData = encodeAddOwnerFunc(web3, accounts[2])
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

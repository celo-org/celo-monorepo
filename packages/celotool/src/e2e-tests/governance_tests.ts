import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import { strip0x } from '../lib/utils'
import {
  assertRevert,
  erc20Abi,
  getContext,
  getContractAddress,
  getEnode,
  importGenesis,
  initAndStartGeth,
  sleep,
} from './utils'

// TODO(asa): Use the contract kit here instead
const electionAbi = [
  {
    constant: true,
    inputs: [
      {
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'validatorAddressFromCurrentSet',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'numberValidatorsInCurrentSet',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

const validatorsAbi = [
  {
    constant: true,
    inputs: [],
    name: 'getRegisteredValidatorGroups',
    outputs: [
      {
        name: '',
        type: 'address[]',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: 'account',
        type: 'address',
      },
    ],
    name: 'getValidatorGroup',
    outputs: [
      {
        name: '',
        type: 'string',
      },
      {
        name: '',
        type: 'string',
      },
      {
        name: '',
        type: 'address[]',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'validator',
        type: 'address',
      },
    ],
    name: 'addMember',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'validator',
        type: 'address',
      },
    ],
    name: 'removeMember',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

describe('governance tests', () => {
  const gethConfig = {
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
  let web3: any
  let election: any
  let validators: any
  let goldToken: any

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  // after(context.hooks.after)

  const restart = async () => {
    await context.hooks.restart()
    web3 = new Web3('http://localhost:8545')
    goldToken = new web3.eth.Contract(erc20Abi, await getContractAddress('GoldTokenProxy'))
    validators = new web3.eth.Contract(validatorsAbi, await getContractAddress('ValidatorsProxy'))
  }

  const unlockAccount = async (address: string, theWeb3: any) => {
    // Assuming empty password
    await theWeb3.eth.personal.unlockAccount(address, '', 1000)
  }

  const getValidatorGroupMembers = async () => {
    const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
    const groupInfo = await validators.methods.getValidatorGroup(groupAddress).call()
    return groupInfo[2]
  }

  const getValidatorGroupKeys = async () => {
    const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
    const groupInfo = await validators.methods.getValidatorGroup(groupAddress).call()
    const encryptedKeystore64 = groupInfo[0].split(' ')[1]
    const encryptedKeystore = JSON.parse(Buffer.from(encryptedKeystore64, 'base64').toString())
    // The validator group ID is the validator group keystore encrypted with validator 0's
    // private key.
    // @ts-ignore
    const encryptionKey = `0x${gethConfig.instances[0].privateKey}`
    const decryptedKeystore = web3.eth.accounts.decrypt(encryptedKeystore, encryptionKey)
    return [groupAddress, decryptedKeystore.privateKey]
  }

  const removeMember = async (
    groupWeb3: any,
    group: string,
    member: string,
    txOptions: any = {}
  ) => {
    await unlockAccount(group, groupWeb3)
    const tx = validators.methods.removeMember(member)
    let gas = txOptions.gas
    if (!gas) {
      gas = await tx.estimateGas({ ...txOptions })
    }
    return tx.send({ from: group, ...txOptions, gas })
  }

  const addMember = async (groupWeb3: any, group: string, member: string, txOptions: any = {}) => {
    await unlockAccount(group, groupWeb3)
    const tx = validators.methods.addMember(member)
    let gas = txOptions.gas
    if (!gas) {
      gas = await tx.estimateGas({ ...txOptions })
    }
    return tx.send({ from: group, ...txOptions, gas })
  }

  describe('Election.numberValidatorsInCurrentSet()', () => {
    before(async function() {
      this.timeout(0)
      await restart()
      validators = new web3.eth.Contract(validatorsAbi, await getContractAddress('ValidatorsProxy'))
      election = new web3.eth.Contract(electionAbi, await getContractAddress('ElectionProxy'))
    })

    it('should return the validator set size', async () => {
      const numberValidators = await election.methods.numberValidatorsInCurrentSet().call()
      assert.equal(numberValidators, 5)
    })

    describe('after the validator set changes', () => {
      before(async function() {
        this.timeout(0)
        await restart()
        const [groupAddress, groupPrivateKey] = await getValidatorGroupKeys()
        const epoch = 10

        const groupInstance = {
          name: 'validatorGroup',
          validating: false,
          syncmode: 'full',
          port: 30325,
          wsport: 8567,
          privateKey: groupPrivateKey.slice(2),
          peers: [await getEnode(8545)],
        }
        await initAndStartGeth(context.hooks.gethBinaryPath, groupInstance)
        const groupWeb3 = new Web3('ws://localhost:8567')
        election = new web3.eth.Contract(electionAbi, await getContractAddress('ElectionProxy'))
        validators = new groupWeb3.eth.Contract(
          validatorsAbi,
          await getContractAddress('ValidatorsProxy')
        )
        // Give the node time to sync.
        await sleep(15)
        const members = await getValidatorGroupMembers()
        await removeMember(groupWeb3, groupAddress, members[0])
        await sleep(epoch * 2)
      })

      it('should return the reduced validator set size', async () => {
        const numberValidators = await election.methods.numberValidatorsInCurrentSet().call()

        assert.equal(numberValidators, 4)
      })
    })
  })

  describe('Election.validatorAddressFromCurrentSet()', () => {
    before(async function() {
      this.timeout(0)
      await restart()
      election = new web3.eth.Contract(electionAbi, await getContractAddress('ElectionProxy'))
      validators = new web3.eth.Contract(validatorsAbi, await getContractAddress('ValidatorsProxy'))
    })

    it('should return the first validator', async () => {
      const resultAddress = await election.methods.validatorAddressFromCurrentSet(0).call()

      assert.equal(strip0x(resultAddress), context.validators[0].address)
    })

    it('should return the third validator', async () => {
      const resultAddress = await election.methods.validatorAddressFromCurrentSet(2).call()

      assert.equal(strip0x(resultAddress), context.validators[2].address)
    })

    it('should return the fifth validator', async () => {
      const resultAddress = await election.methods.validatorAddressFromCurrentSet(4).call()

      assert.equal(strip0x(resultAddress), context.validators[4].address)
    })

    it('should revert when asked for an out of bounds validator', async function(this: any) {
      this.timeout(0) // Disable test timeout
      await assertRevert(
        election.methods.validatorAddressFromCurrentSet(5).send({
          from: `0x${context.validators[0].address}`,
        })
      )
    })

    describe('after the validator set changes', () => {
      before(async function() {
        this.timeout(0)
        await restart()
        const [groupAddress, groupPrivateKey] = await getValidatorGroupKeys()
        const epoch = 10

        const groupInstance = {
          name: 'validatorGroup',
          validating: false,
          syncmode: 'full',
          port: 30325,
          wsport: 8567,
          privateKey: groupPrivateKey.slice(2),
          peers: [await getEnode(8545)],
        }
        await initAndStartGeth(context.hooks.gethBinaryPath, groupInstance)
        const groupWeb3 = new Web3('ws://localhost:8567')
        validators = new groupWeb3.eth.Contract(
          validatorsAbi,
          await getContractAddress('ValidatorsProxy')
        )
        // Give the node time to sync.
        await sleep(15)
        const members = await getValidatorGroupMembers()
        await removeMember(groupWeb3, groupAddress, members[0])
        await sleep(epoch * 2)

        election = new web3.eth.Contract(electionAbi, await getContractAddress('ElectionProxy'))
        validators = new web3.eth.Contract(
          validatorsAbi,
          await getContractAddress('ValidatorsProxy')
        )
      })

      it('should return the second validator in the first place', async () => {
        const resultAddress = await election.methods.validatorAddressFromCurrentSet(0).call()

        assert.equal(strip0x(resultAddress), context.validators[1].address)
      })

      it('should return the last validator in the fourth place', async () => {
        const resultAddress = await election.methods.validatorAddressFromCurrentSet(3).call()

        assert.equal(strip0x(resultAddress), context.validators[4].address)
      })

      it('should revert when asked for an out of bounds validator', async function(this: any) {
        this.timeout(0)
        await assertRevert(
          election.methods.validatorAddressFromCurrentSet(4).send({
            from: `0x${context.validators[0].address}`,
          })
        )
      })
    })
  })

  describe('when the validator set is changing', () => {
    const epoch = 10
    const expectedEpochMembership = new Map()
    before(async function() {
      this.timeout(0)
      await restart()
      const [groupAddress, groupPrivateKey] = await getValidatorGroupKeys()

      const groupInstance = {
        name: 'validatorGroup',
        validating: false,
        syncmode: 'full',
        port: 30325,
        wsport: 8567,
        privateKey: groupPrivateKey.slice(2),
        peers: [await getEnode(8545)],
      }
      await initAndStartGeth(context.hooks.gethBinaryPath, groupInstance)
      const groupWeb3 = new Web3('ws://localhost:8567')
      validators = new groupWeb3.eth.Contract(
        validatorsAbi,
        await getContractAddress('ValidatorsProxy')
      )
      // Give the node time to sync.
      await sleep(15)
      const members = await getValidatorGroupMembers()
      const membersToSwap = [members[0], members[1]]
      // Start with 10 nodes
      await removeMember(groupWeb3, groupAddress, membersToSwap[0])

      const changeValidatorSet = async (header: any) => {
        // At the start of epoch N, swap members so the validator set is different for epoch N + 1.
        if (header.number % epoch === 0) {
          const groupMembers = await getValidatorGroupMembers()
          const direction = groupMembers.includes(membersToSwap[0])
          const removedMember = direction ? membersToSwap[0] : membersToSwap[1]
          const addedMember = direction ? membersToSwap[1] : membersToSwap[0]
          expectedEpochMembership.set(header.number / epoch, [removedMember, addedMember])
          await removeMember(groupWeb3, groupAddress, removedMember)
          await addMember(groupWeb3, groupAddress, addedMember)
          const newMembers = await getValidatorGroupMembers()
          assert.include(newMembers, addedMember)
          assert.notInclude(newMembers, removedMember)
        }
      }

      const subscription = await groupWeb3.eth.subscribe('newBlockHeaders')
      subscription.on('data', changeValidatorSet)
      // Wait for a few epochs while changing the validator set.
      await sleep(epoch * 3)
      ;(subscription as any).unsubscribe()
      // Wait for the current epoch to complete.
      await sleep(epoch)
    })

    it('should have produced blocks with the correct validator set', async function(this: any) {
      this.timeout(0) // Disable test timeout
      assert.equal(expectedEpochMembership.size, 3)
      // tslint:disable-next-line: no-console
      for (const [epochNumber, membership] of expectedEpochMembership) {
        let containsExpectedMember = false
        for (let i = epochNumber * epoch + 1; i < (epochNumber + 1) * epoch + 1; i++) {
          const block = await web3.eth.getBlock(i)
          assert.notEqual(block.miner.toLowerCase(), membership[1].toLowerCase())
          containsExpectedMember =
            containsExpectedMember || block.miner.toLowerCase() === membership[0].toLowerCase()
        }
        assert.isTrue(containsExpectedMember)
      }
    })
  })

  describe('when adding any block', () => {
    let goldGenesisSupply: any
    const addressesWithBalance: string[] = []
    beforeEach(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
      const genesis = await importGenesis()
      goldGenesisSupply = new BigNumber(0)
      Object.keys(genesis.alloc).forEach((validator) => {
        addressesWithBalance.push(validator)
        goldGenesisSupply = goldGenesisSupply.plus(genesis.alloc[validator].balance)
      })
      // Block rewards are paid to governance and Locked Gold.
      // Governance also receives a portion of transaction fees.
      addressesWithBalance.push(await getContractAddress('GovernanceProxy'))
      addressesWithBalance.push(await getContractAddress('LockedGoldProxy'))
      // Some gold is sent to the reserve and exchange during migrations.
      addressesWithBalance.push(await getContractAddress('ReserveProxy'))
      addressesWithBalance.push(await getContractAddress('ExchangeProxy'))
    })

    it('should update the Celo Gold total supply correctly', async function(this: any) {
      // To register a validator group, we send gold to a new address not included in
      // `addressesWithBalance`. Therefore, we check the gold total supply at a block before
      // that gold is sent.
      // We don't set the total supply until block rewards are paid out, which can happen once
      // either LockedGold or Governance are registered.
      const blockNumber = 175
      const goldTotalSupply = await goldToken.methods.totalSupply().call({}, blockNumber)
      const balances = await Promise.all(
        addressesWithBalance.map(
          async (a: string) => new BigNumber(await web3.eth.getBalance(a, blockNumber))
        )
      )
      const expectedGoldTotalSupply = balances.reduce((total: BigNumber, b: BigNumber) =>
        b.plus(total)
      )
      assert.isAtLeast(expectedGoldTotalSupply.toNumber(), goldGenesisSupply.toNumber())
      assert.equal(goldTotalSupply.toString(), expectedGoldTotalSupply.toString())
    })
  })
})

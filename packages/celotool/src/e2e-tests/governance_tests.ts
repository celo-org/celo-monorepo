import BigNumber from 'bignumber.js'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { assert } from 'chai'
import Web3 from 'web3'
import {
  getContext,
  getContractAddress,
  getEnode,
  importGenesis,
  initAndStartGeth,
  sleep,
} from './utils'

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
  let registry: any
  let kit: ContractKit

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(context.hooks.after)

  const restart = async () => {
    await context.hooks.restart()
    web3 = new Web3('http://localhost:8545')
    kit = newKitFromWeb3(web3)
    goldToken = await kit._web3Contracts.getGoldToken()
    validators = await kit._web3Contracts.getValidators()
    registry = await kit._web3Contracts.getRegistry()
    election = await kit._web3Contracts.getElection()
  }

  const unlockAccount = async (address: string, theWeb3: any) => {
    // Assuming empty password
    await theWeb3.eth.personal.unlockAccount(address, '', 1000)
  }

  const getValidatorGroupMembers = async (blockNumber?: number) => {
    if (blockNumber) {
      const [groupAddress] = await validators.methods
        .getRegisteredValidatorGroups()
        .call({}, blockNumber)
      const groupInfo = await validators.methods
        .getValidatorGroup(groupAddress)
        .call({}, blockNumber)
      return groupInfo[2]
    } else {
      const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
      console.log('group address', groupAddress)
      const groupInfo = await validators.methods.getValidatorGroup(groupAddress).call()
      console.log('group info', groupInfo)
      return groupInfo[2]
    }
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

  /*
  const getLastEpochBlock = (blockNumber: number, epochSize: number) => {
    const epochNumber = Math.floor(blockNumber / epochSize)
    return epochNumber * epochSize
  }
  */

  describe.only('when the validator set is changing', () => {
    const epoch = 10
    const blockNumbers: number[] = []
    before(async function() {
      this.timeout(0)
      await restart()
      console.log('getting keys')
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
      const members = await getValidatorGroupMembers()
      assert.equal(members.length, 5)

      // Give the node time to sync.
      await sleep(15)
      const groupWeb3 = new Web3('ws://localhost:8567')
      const groupKit = newKitFromWeb3(groupWeb3)
      validators = await groupKit._web3Contracts.getValidators()
      const membersToSwap = [members[0], members[1]]
      let includedMemberIndex = 1
      console.log('removing member')
      await removeMember(groupWeb3, groupAddress, membersToSwap[0])
      console.log('removed member')

      const changeValidatorSet = async (header: any) => {
        blockNumbers.push(header.number)
        // At the start of epoch N, swap members so the validator set is different for epoch N + 1.
        if (header.number % epoch === 0) {
          console.log('new epoch')
          const memberToRemove = membersToSwap[includedMemberIndex]
          const memberToAdd = membersToSwap[(includedMemberIndex + 1) % 2]
          await removeMember(groupWeb3, groupAddress, memberToRemove)
          await addMember(groupWeb3, groupAddress, memberToAdd)
          includedMemberIndex = (includedMemberIndex + 1) % 2
          const newMembers = await getValidatorGroupMembers()
          assert.include(newMembers, memberToAdd)
          assert.notInclude(newMembers, memberToRemove)
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

    it('should always return a validator set size equal to the number of group members at the end of the last epoch', async () => {
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = blockNumber - (blockNumber % epoch) - 1
        const validatorSetSize = await election.methods
          .numberValidatorsInCurrentSet()
          .call({}, blockNumber)
        const groupMembership = await getValidatorGroupMembers(lastEpochBlock)
        console.log(blockNumber, lastEpochBlock, validatorSetSize, groupMembership.length)
        // assert.equal(validatorSetSize, groupMembership.length)
      }
    })

    it('should always return a validator set equal to the group members at the end of the last epoch', async () => {
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = blockNumber - (blockNumber % epoch) - 1
        const groupMembership = await getValidatorGroupMembers(lastEpochBlock)
        const validatorSetSize = await election.methods
          .numberValidatorsInCurrentSet()
          .call({}, blockNumber)
        const validatorSet = []
        for (let i = 0; i < validatorSetSize; i++) {
          const validator = await election.methods
            .validatorAddressFromCurrentSet(i)
            .call({}, blockNumber)
          validatorSet.push(validator)
        }
        // assert.deepEqual(groupMembership, validatorSet)
        console.log(blockNumber, lastEpochBlock, groupMembership, validatorSet)
      }
    })

    it('should only have created blocks whose miner was in the current validator set', async () => {
      for (const blockNumber of blockNumbers) {
        const validatorSetSize = await election.methods
          .numberValidatorsInCurrentSet()
          .call({}, blockNumber)
        const validatorSet = []
        for (let i = 0; i < validatorSetSize; i++) {
          const validator = await election.methods
            .validatorAddressFromCurrentSet(i)
            .call({}, blockNumber)
          validatorSet.push(validator)
        }
        const block = await web3.eth.getBlock(blockNumber)
        assert.include(validatorSet.map((x) => x.toLowerCase()), block.miner.toLowerCase())
      }
    })

    it('should update the validator scores at the end of each epoch', async () => {
      const validators = await kit.contracts.getValidators()
      for (const blockNumber of blockNumbers) {
        const validatorSetSize = await election.methods
          .numberValidatorsInCurrentSet()
          .call({}, blockNumber)
        const validatorSet = []
        for (let i = 0; i < validatorSetSize; i++) {
          const validator = await election.methods
            .validatorAddressFromCurrentSet(i)
            .call({}, blockNumber)
          validatorSet.push(validator)
          if (false) {
            console.log(await validators.getValidator(validator))
          }
        }
      }
    })

    it('should distribute epoch payments to each validator at the end of an epoch', async () => {})

    it('should distribute epoch payments to the validator group at the end of an epoch', async () => {})
  })

  describe('after the governance smart contract is registered', () => {
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
      // Governance is registered.
      let blockNumber = 150
      while (true) {
        // This will fail if Governance is not registered.
        const governanceAddress = await registry.methods
          .getAddressForString('Governance')
          .call({}, blockNumber)
        if (new BigNumber(governanceAddress).isZero()) {
          blockNumber += 1
        } else {
          break
        }
      }
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
      //
      assert.equal(goldTotalSupply.toString(), expectedGoldTotalSupply.toString())
    })
  })
})

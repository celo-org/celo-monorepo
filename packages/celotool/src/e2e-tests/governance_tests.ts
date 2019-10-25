import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import { getContext, getEnode, importGenesis, initAndStartGeth, sleep } from './utils'

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
      return groupInfo[1]
    } else {
      const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
      const groupInfo = await validators.methods.getValidatorGroup(groupAddress).call()
      return groupInfo[1]
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

  const activate = async (account: string, txOptions: any = {}) => {
    await unlockAccount(account, web3)
    const [group] = await validators.methods.getRegisteredValidatorGroups().call()
    const tx = election.methods.activate(group)
    let gas = txOptions.gas
    if (!gas) {
      gas = await tx.estimateGas({ ...txOptions })
    }
    return tx.send({ from: account, ...txOptions, gas })
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

  const isLastBlockOfEpoch = (blockNumber: number, epochSize: number) => {
    return blockNumber % epochSize === 0
  }

  describe('when the validator set is changing', () => {
    let epoch: number
    const blockNumbers: number[] = []
    let allValidators: string[]
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
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
      allValidators = await getValidatorGroupMembers()
      assert.equal(allValidators.length, 5)
      epoch = new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
      assert.equal(epoch, 10)

      // Give the node time to sync, and time for an epoch transition so we can activate our vote.
      await sleep(20)
      await activate(allValidators[0])
      const groupWeb3 = new Web3('ws://localhost:8567')
      const groupKit = newKitFromWeb3(groupWeb3)
      validators = await groupKit._web3Contracts.getValidators()
      const membersToSwap = [allValidators[0], allValidators[1]]
      let includedMemberIndex = 1
      await removeMember(groupWeb3, groupAddress, membersToSwap[0])

      const changeValidatorSet = async (header: any) => {
        blockNumbers.push(header.number)
        // At the start of epoch N, swap members so the validator set is different for epoch N + 1.
        if (header.number % epoch === 1) {
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
      await sleep(epoch * 4)
      ;(subscription as any).unsubscribe()
      // Wait for the current epoch to complete.
      await sleep(epoch)
    })

    const getValidatorSetAtBlock = async (blockNumber: number) => {
      const validatorSetSize = await election.methods
        .numberValidatorsInCurrentSet()
        .call({}, blockNumber)
      const validatorSet = []
      for (let i = 0; i < validatorSetSize; i++) {
        validatorSet.push(
          await election.methods.validatorAddressFromCurrentSet(i).call({}, blockNumber)
        )
      }
      return validatorSet
    }

    const getLastEpochBlock = (blockNumber: number) => {
      const epochNumber = Math.floor((blockNumber - 1) / epoch)
      return epochNumber * epoch
    }

    it('should always return a validator set size equal to the number of group members at the end of the last epoch', async () => {
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = getLastEpochBlock(blockNumber)
        const validatorSetSize = await election.methods
          .numberValidatorsInCurrentSet()
          .call({}, blockNumber)
        const groupMembership = await getValidatorGroupMembers(lastEpochBlock)
        assert.equal(validatorSetSize, groupMembership.length)
      }
    })

    it('should always return a validator set equal to the group members at the end of the last epoch', async () => {
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = getLastEpochBlock(blockNumber)
        const groupMembership = await getValidatorGroupMembers(lastEpochBlock)
        const validatorSet = await getValidatorSetAtBlock(blockNumber)
        assert.sameMembers(groupMembership, validatorSet)
      }
    })

    it('should only have created blocks whose miner was in the current validator set', async () => {
      for (const blockNumber of blockNumbers) {
        const validatorSet = await getValidatorSetAtBlock(blockNumber)
        const block = await web3.eth.getBlock(blockNumber)
        assert.include(validatorSet.map((x) => x.toLowerCase()), block.miner.toLowerCase())
      }
    })

    it('should update the validator scores at the end of each epoch', async () => {
      const adjustmentSpeed = fromFixed(
        new BigNumber((await validators.methods.getValidatorScoreParameters().call())[1])
      )
      const uptime = 1

      const assertScoreUnchanged = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber))[3]
        )
        const previousScore = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber - 1))[3]
        )
        assert.isNotNaN(score)
        assert.isNotNaN(previousScore)
        assert.equal(score.toFixed(), previousScore.toFixed())
      }

      const assertScoreChanged = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber))[3]
        )
        const previousScore = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber - 1))[3]
        )
        const expectedScore = adjustmentSpeed
          .times(uptime)
          .plus(new BigNumber(1).minus(adjustmentSpeed).times(fromFixed(previousScore)))
        assert.isNotNaN(score)
        assert.isNotNaN(previousScore)
        assert.equal(score.toFixed(), toFixed(expectedScore).toFixed())
      }

      for (const blockNumber of blockNumbers) {
        let expectUnchangedScores: string[]
        let expectChangedScores: string[]
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          expectChangedScores = await getValidatorSetAtBlock(blockNumber)
          expectUnchangedScores = allValidators.filter((x) => !expectChangedScores.includes(x))
        } else {
          expectUnchangedScores = allValidators
          expectChangedScores = []
        }

        for (const validator of expectUnchangedScores) {
          await assertScoreUnchanged(validator, blockNumber)
        }

        for (const validator of expectChangedScores) {
          await assertScoreChanged(validator, blockNumber)
        }
      }
    })

    it('should distribute epoch payments at the end of each epoch', async () => {
      const stableToken = await kit._web3Contracts.getStableToken()
      const commission = 0.1
      const validatorEpochPayment = new BigNumber(
        await validators.methods.validatorEpochPayment().call()
      )
      const [group] = await validators.methods.getRegisteredValidatorGroups().call()

      const assertBalanceChanged = async (
        validator: string,
        blockNumber: number,
        expected: BigNumber
      ) => {
        const currentBalance = new BigNumber(
          await stableToken.methods.balanceOf(validator).call({}, blockNumber)
        )
        const previousBalance = new BigNumber(
          await stableToken.methods.balanceOf(validator).call({}, blockNumber - 1)
        )
        assert.isNotNaN(currentBalance)
        assert.isNotNaN(previousBalance)
        assert.equal(expected.toFixed(), currentBalance.minus(previousBalance).toFixed())
      }

      const assertBalanceUnchanged = async (validator: string, blockNumber: number) => {
        await assertBalanceChanged(validator, blockNumber, new BigNumber(0))
      }

      const getExpectedTotalPayment = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber))[3]
        )
        assert.isNotNaN(score)
        return validatorEpochPayment.times(fromFixed(score))
      }

      for (const blockNumber of blockNumbers) {
        let expectUnchangedBalances: string[]
        let expectChangedBalances: string[]
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          expectChangedBalances = await getValidatorSetAtBlock(blockNumber)
          expectUnchangedBalances = allValidators.filter((x) => !expectChangedBalances.includes(x))
        } else {
          expectUnchangedBalances = allValidators
          expectChangedBalances = []
        }

        for (const validator of expectUnchangedBalances) {
          await assertBalanceUnchanged(validator, blockNumber)
        }

        let expectedGroupPayment = new BigNumber(0)
        for (const validator of expectChangedBalances) {
          const expectedTotalPayment = await getExpectedTotalPayment(validator, blockNumber)
          const groupPayment = expectedTotalPayment.times(commission)
          await assertBalanceChanged(
            validator,
            blockNumber,
            expectedTotalPayment.minus(groupPayment)
          )
          expectedGroupPayment = expectedGroupPayment.plus(groupPayment)
        }
        await assertBalanceChanged(group, blockNumber, expectedGroupPayment)
      }
    })

    it('should distribute epoch rewards at the end of each epoch', async () => {
      const lockedGold = await kit._web3Contracts.getLockedGold()
      const governance = await kit._web3Contracts.getGovernance()
      const epochReward = new BigNumber(10).pow(18)
      const infraReward = new BigNumber(10).pow(18)
      const [group] = await validators.methods.getRegisteredValidatorGroups().call()

      const assertVotesChanged = async (blockNumber: number, expected: BigNumber) => {
        const currentVotes = new BigNumber(
          await election.methods.getTotalVotesForGroup(group).call({}, blockNumber)
        )
        const previousVotes = new BigNumber(
          await election.methods.getTotalVotesForGroup(group).call({}, blockNumber - 1)
        )
        assert.equal(expected.toFixed(), currentVotes.minus(previousVotes).toFixed())
      }

      const assertGoldTokenTotalSupplyChanged = async (
        blockNumber: number,
        expected: BigNumber
      ) => {
        const currentSupply = new BigNumber(
          await goldToken.methods.totalSupply().call({}, blockNumber)
        )
        const previousSupply = new BigNumber(
          await goldToken.methods.totalSupply().call({}, blockNumber - 1)
        )
        assert.equal(expected.toFixed(), currentSupply.minus(previousSupply).toFixed())
      }

      const assertBalanceChanged = async (
        address: string,
        blockNumber: number,
        expected: BigNumber
      ) => {
        const currentBalance = new BigNumber(
          await goldToken.methods.balanceOf(address).call({}, blockNumber)
        )
        const previousBalance = new BigNumber(
          await goldToken.methods.balanceOf(address).call({}, blockNumber - 1)
        )
        assert.equal(expected.toFixed(), currentBalance.minus(previousBalance).toFixed())
      }

      const assertLockedGoldBalanceChanged = async (blockNumber: number, expected: BigNumber) => {
        await assertBalanceChanged(lockedGold.options.address, blockNumber, expected)
      }

      const assertGovernanceBalanceChanged = async (blockNumber: number, expected: BigNumber) => {
        await assertBalanceChanged(governance.options.address, blockNumber, expected)
      }

      const assertVotesUnchanged = async (blockNumber: number) => {
        await assertVotesChanged(blockNumber, new BigNumber(0))
      }

      const assertGoldTokenTotalSupplyUnchanged = async (blockNumber: number) => {
        await assertGoldTokenTotalSupplyChanged(blockNumber, new BigNumber(0))
      }

      const assertLockedGoldBalanceUnchanged = async (blockNumber: number) => {
        await assertLockedGoldBalanceChanged(blockNumber, new BigNumber(0))
      }

      const assertGovernanceBalanceUnchanged = async (blockNumber: number) => {
        await assertGovernanceBalanceChanged(blockNumber, new BigNumber(0))
      }

      for (const blockNumber of blockNumbers) {
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          await assertVotesChanged(blockNumber, epochReward)
          await assertGoldTokenTotalSupplyChanged(blockNumber, epochReward.plus(infraReward))
          await assertLockedGoldBalanceChanged(blockNumber, epochReward)
          await assertGovernanceBalanceChanged(blockNumber, infraReward)
        } else {
          await assertVotesUnchanged(blockNumber)
          await assertGoldTokenTotalSupplyUnchanged(blockNumber)
          await assertLockedGoldBalanceUnchanged(blockNumber)
          await assertGovernanceBalanceUnchanged(blockNumber)
        }
      }
    })
  })

  describe('after the gold token smart contract is registered', () => {
    let goldGenesisSupply = new BigNumber(0)
    beforeEach(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
      const genesis = await importGenesis()
      Object.keys(genesis.alloc).forEach((address) => {
        goldGenesisSupply = goldGenesisSupply.plus(genesis.alloc[address].balance)
      })
    })

    it('should initialize the Celo Gold total supply correctly', async function(this: any) {
      const events = await registry.getPastEvents('RegistryUpdated', { fromBlock: 0 })
      let blockNumber = 0
      for (const e of events) {
        if (e.returnValues.identifier === 'GoldToken') {
          blockNumber = e.blockNumber
          break
        }
      }
      assert.isAtLeast(blockNumber, 1)
      const goldTotalSupply = await goldToken.methods.totalSupply().call({}, blockNumber)
      assert.equal(goldTotalSupply, goldGenesisSupply.toFixed())
    })
  })
})

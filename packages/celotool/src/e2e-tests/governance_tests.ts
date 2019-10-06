import BigNumber from 'bignumber.js'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
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
    // await context.hooks.before()
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
      const groupInfo = await validators.methods.getValidatorGroup(groupAddress).call()
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

  const isLastBlockOfEpoch = (blockNumber: number, epochSize: number) => {
    return blockNumber % epochSize == 0
  }

  describe('when the validator set is changing', () => {
    const epoch = 10
    const blockNumbers: number[] = []
    let allValidators: string[]
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
      allValidators = await getValidatorGroupMembers()
      assert.equal(allValidators.length, 5)

      // Give the node time to sync.
      await sleep(15)
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

    // Note that this returns the validator set at the END of `blockNumber`, i.e. the validator set
    // that will validate the next block, and NOT necessarily the validator set that validated this
    // block.
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

    it('should always return a validator set size equal to the number of group members at the end of the last epoch', async () => {
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = blockNumber - (blockNumber % epoch)
        const validatorSetSize = await election.methods
          .numberValidatorsInCurrentSet()
          .call({}, blockNumber)
        const groupMembership = await getValidatorGroupMembers(lastEpochBlock)
        assert.equal(validatorSetSize, groupMembership.length)
      }
    })

    it('should always return a validator set equal to the group members at the end of the last epoch', async () => {
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = blockNumber - (blockNumber % epoch)
        const groupMembership = await getValidatorGroupMembers(lastEpochBlock)
        const validatorSet = await getValidatorSetAtBlock(blockNumber)
        assert.sameMembers(groupMembership, validatorSet)
      }
    })

    it('should only have created blocks whose miner was in the current validator set', async () => {
      for (const blockNumber of blockNumbers) {
        // The validators responsible for creating `blockNumber` were those in the validator set at
        // `blockNumber-1`.
        const validatorSet = await getValidatorSetAtBlock(blockNumber - 1)
        const block = await web3.eth.getBlock(blockNumber)
        assert.include(validatorSet.map((x) => x.toLowerCase()), block.miner.toLowerCase())
      }
    })

    it('should update the validator scores at the end of each epoch', async () => {
      const validators = await kit._web3Contracts.getValidators()
      const adjustmentSpeed = fromFixed(
        new BigNumber((await validators.methods.getValidatorScoreParameters().call())[1])
      )
      const uptime = 1

      const assertScoreUnchanged = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber))[4]
        )
        const previousScore = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber - 1))[4]
        )
        assert.equal(score.toFixed(), previousScore.toFixed())
      }

      const assertScoreChanged = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber))[4]
        )
        const previousScore = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber - 1))[4]
        )
        const expectedScore = adjustmentSpeed
          .times(uptime)
          .plus(new BigNumber(1).minus(adjustmentSpeed).times(fromFixed(previousScore)))
        assert.equal(score.toFixed(), toFixed(expectedScore).toFixed())
      }

      for (const blockNumber of blockNumbers) {
        let expectUnchangedScores: string[]
        let expectChangedScores: string[]
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          expectChangedScores = await getValidatorSetAtBlock(blockNumber - 1)
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
      const validators = await kit._web3Contracts.getValidators()
      const stableToken = await kit._web3Contracts.getStableToken()
      const commission = 0.1
      const validatorEpochPayment = new BigNumber(
        await validators.methods.validatorEpochPayment().call()
      )
      const [group] = await validators.methods.getRegisteredValidatorGroups().call()

      const assertBalanceUnchanged = async (validator: string, blockNumber: number) => {
        const currentBalance = new BigNumber(
          await stableToken.methods.balanceOf(validator).call({}, blockNumber)
        )
        const previousBalance = new BigNumber(
          await stableToken.methods.balanceOf(validator).call({}, blockNumber - 1)
        )
        assert.equal(currentBalance.toFixed(), previousBalance.toFixed())
      }

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
        assert.equal(expected.toFixed(), currentBalance.minus(previousBalance).toFixed())
      }

      const getExpectedTotalPayment = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber))[4]
        )
        return validatorEpochPayment.times(fromFixed(score))
      }

      for (const blockNumber of blockNumbers) {
        let expectUnchangedBalances: string[]
        let expectChangedBalances: string[]
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          expectChangedBalances = await getValidatorSetAtBlock(blockNumber - 1)
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
      const validators = await kit._web3Contracts.getValidators()
      const election = await kit._web3Contracts.getElection()
      // const lockedGold = await kit._web3Contracts.getLockedGold()
      const epochReward = new BigNumber(10).pow(18)
      const [group] = await validators.methods.getRegisteredValidatorGroups().call()

      const assertVotesUnchanged = async (group: string, blockNumber: number) => {
        const currentVotes = new BigNumber(
          await election.methods.getGroupTotalVotes(group).call({}, blockNumber)
        )
        const previousVotes = new BigNumber(
          await election.methods.getGroupTotalVotes(group).call({}, blockNumber - 1)
        )
        assert.equal(currentVotes.toFixed(), previousVotes.toFixed())
      }

      const assertVotesChanged = async (
        group: string,
        blockNumber: number,
        expected: BigNumber
      ) => {
        const currentVotes = new BigNumber(
          await election.methods.getGroupTotalVotes(group).call({}, blockNumber)
        )
        const previousVotes = new BigNumber(
          await election.methods.getGroupTotalVotes(group).call({}, blockNumber - 1)
        )
        console.log(
          currentVotes.toFixed(),
          previousVotes.toFixed(),
          expected.toFixed(),
          currentVotes.minus(previousVotes).toFixed()
        )
        assert.equal(expected.toFixed(), currentVotes.minus(previousVotes).toFixed())
      }

      for (const blockNumber of blockNumbers) {
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          await assertVotesChanged(group, blockNumber, epochReward)
        } else {
          await assertVotesUnchanged(group, blockNumber)
        }
      }
    })
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
      assert.equal(goldTotalSupply.toString(), expectedGoldTotalSupply.toString())
    })
  })
})

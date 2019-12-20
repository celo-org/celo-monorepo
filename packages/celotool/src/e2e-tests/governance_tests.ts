// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3.d.ts" />
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { getBlsPoP, getBlsPublicKey } from '@celo/utils/lib/bls'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import {
  assertAlmostEqual,
  getContext,
  GethInstanceConfig,
  importGenesis,
  initAndStartGeth,
  sleep,
  waitToFinishSyncing,
} from './utils'

interface MemberSwapper {
  swap(): Promise<void>
}

async function newMemberSwapper(kit: ContractKit, members: string[]): Promise<MemberSwapper> {
  let index = 0
  const group = (await kit.web3.eth.getAccounts())[0]
  await Promise.all(members.slice(1).map((member) => removeMember(member)))

  async function removeMember(member: string) {
    return (await kit.contracts.getValidators())
      .removeMember(member)
      .sendAndWaitForReceipt({ from: group })
  }

  async function addMember(member: string) {
    return (await (await kit.contracts.getValidators()).addMember(
      group,
      member
    )).sendAndWaitForReceipt({ from: group })
  }

  async function getGroupMembers() {
    const groupInfo = await (await kit._web3Contracts.getValidators()).methods
      .getValidatorGroup(group)
      .call()
    return groupInfo[0]
  }

  return {
    async swap() {
      const removedMember = members[index % members.length]
      await removeMember(members[index % members.length])
      index = index + 1
      const addedMember = members[index % members.length]
      await addMember(members[index % members.length])
      const groupMembers = await getGroupMembers()
      assert.include(groupMembers, addedMember)
      assert.notInclude(groupMembers, removedMember)
    },
  }
}

interface KeyRotator {
  rotate(): Promise<void>
}

async function newKeyRotator(
  kit: ContractKit,
  web3s: Web3[],
  privateKeys: string[]
): Promise<KeyRotator> {
  let index = 0
  const validator = (await kit.web3.eth.getAccounts())[0]
  const accountsWrapper = await kit.contracts.getAccounts()

  async function authorizeValidatorSigner(signer: string, signerWeb3: any) {
    const signerKit = newKitFromWeb3(signerWeb3)
    const pop = await (await signerKit.contracts.getAccounts()).generateProofOfSigningKeyPossession(
      validator,
      signer
    )
    return (await accountsWrapper.authorizeValidatorSigner(signer, pop)).sendAndWaitForReceipt({
      from: validator,
    })
  }

  async function updateValidatorBlsKey(signerPrivateKey: string) {
    const blsPublicKey = getBlsPublicKey(signerPrivateKey)
    const blsPop = getBlsPoP(validator, signerPrivateKey)
    // TODO(asa): Send this from the signer instead.
    const validatorsWrapper = await kit.contracts.getValidators()
    return validatorsWrapper
      .updateBlsPublicKey(blsPublicKey, blsPop)
      .sendAndWaitForReceipt({ from: validator })
  }

  return {
    async rotate() {
      if (index < web3s.length) {
        const signerWeb3 = web3s[index]
        const signer: string = (await signerWeb3.eth.getAccounts())[0]
        const signerPrivateKey = privateKeys[index]
        await Promise.all([
          authorizeValidatorSigner(signer, signerWeb3),
          updateValidatorBlsKey(signerPrivateKey),
        ])
        index += 1
        assert.equal(await accountsWrapper.getValidatorSigner(validator), signer)
      }
    },
  }
}

// TODO(asa): Test independent rotation of ecdsa, bls keys.
describe('governance tests', () => {
  const gethConfig = {
    migrate: true,
    instances: [
      // Validators 0 and 1 are swapped in and out of the group.
      { name: 'validator0', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
      { name: 'validator1', validating: true, syncmode: 'full', port: 30305, rpcport: 8547 },
      // Validator 2 will authorize a validating key every other epoch.
      { name: 'validator2', validating: true, syncmode: 'full', port: 30307, rpcport: 8549 },
      { name: 'validator3', validating: true, syncmode: 'full', port: 30309, rpcport: 8551 },
      { name: 'validator4', validating: true, syncmode: 'full', port: 30311, rpcport: 8553 },
    ],
  }

  const context: any = getContext(gethConfig)
  let web3: any
  let election: any
  let stableToken: any
  let sortedOracles: any
  let epochRewards: any
  let goldToken: any
  let registry: any
  let reserve: any
  let validators: any
  let accounts: any
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
    stableToken = await kit._web3Contracts.getStableToken()
    sortedOracles = await kit._web3Contracts.getSortedOracles()
    validators = await kit._web3Contracts.getValidators()
    registry = await kit._web3Contracts.getRegistry()
    reserve = await kit._web3Contracts.getReserve()
    election = await kit._web3Contracts.getElection()
    epochRewards = await kit._web3Contracts.getEpochRewards()
    accounts = await kit._web3Contracts.getAccounts()
  }

  const getValidatorGroupMembers = async (blockNumber?: number) => {
    if (blockNumber) {
      const [groupAddress] = await validators.methods
        .getRegisteredValidatorGroups()
        .call({}, blockNumber)
      const groupInfo = await validators.methods
        .getValidatorGroup(groupAddress)
        .call({}, blockNumber)
      return groupInfo[0]
    } else {
      const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
      const groupInfo = await validators.methods.getValidatorGroup(groupAddress).call()
      return groupInfo[0]
    }
  }

  const getValidatorSigner = async (address: string, blockNumber?: number) => {
    if (blockNumber) {
      return accounts.methods.getValidatorSigner(address).call({}, blockNumber)
    } else {
      return accounts.methods.getValidatorSigner(address).call()
    }
  }

  const getValidatorGroupPrivateKey = async () => {
    const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
    const name = await accounts.methods.getName(groupAddress).call()
    const encryptedKeystore64 = name.split(' ')[1]
    const encryptedKeystore = JSON.parse(Buffer.from(encryptedKeystore64, 'base64').toString())
    // The validator group ID is the validator group keystore encrypted with validator 0's
    // private key.
    // @ts-ignore
    const encryptionKey = `0x${gethConfig.instances[0].privateKey}`
    const decryptedKeystore = web3.eth.accounts.decrypt(encryptedKeystore, encryptionKey)
    return decryptedKeystore.privateKey
  }

  const isLastBlockOfEpoch = (blockNumber: number, epochSize: number) => {
    return blockNumber % epochSize === 0
  }

  const assertBalanceChanged = async (
    address: string,
    blockNumber: number,
    expected: BigNumber,
    token: any
  ) => {
    const currentBalance = new BigNumber(
      await token.methods.balanceOf(address).call({}, blockNumber)
    )
    const previousBalance = new BigNumber(
      await token.methods.balanceOf(address).call({}, blockNumber - 1)
    )
    assert.isFalse(currentBalance.isNaN())
    assert.isFalse(previousBalance.isNaN())
    assertAlmostEqual(currentBalance.minus(previousBalance), expected)
  }

  const waitForBlock = async (blockNumber: number) => {
    // const epoch = new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
    let currentBlock: number
    do {
      currentBlock = await web3.eth.getBlockNumber()
      await sleep(0.1)
    } while (currentBlock < blockNumber)
  }

  const waitForEpochTransition = async (epoch: number) => {
    // const epoch = new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
    let blockNumber: number
    do {
      blockNumber = await web3.eth.getBlockNumber()
      await sleep(0.1)
    } while (blockNumber % epoch !== 1)
  }

  const assertTargetVotingYieldChanged = async (blockNumber: number, expected: BigNumber) => {
    const currentTarget = new BigNumber(
      (await epochRewards.methods.getTargetVotingYieldParameters().call({}, blockNumber))[0]
    )
    const previousTarget = new BigNumber(
      (await epochRewards.methods.getTargetVotingYieldParameters().call({}, blockNumber - 1))[0]
    )
    const max = new BigNumber(
      (await epochRewards.methods.getTargetVotingYieldParameters().call({}, blockNumber))[1]
    )
    const expectedTarget = previousTarget.plus(expected)
    if (expectedTarget.isGreaterThanOrEqualTo(max)) {
      assert.equal(currentTarget.toFixed(), max.toFixed())
    } else if (expectedTarget.isLessThanOrEqualTo(0)) {
      assert.isTrue(currentTarget.isZero())
    } else {
      const difference = currentTarget.minus(previousTarget)
      // Assert equal to 9 decimal places due to rounding errors.
      assert.equal(
        fromFixed(difference)
          .dp(9)
          .toFixed(),
        fromFixed(expected)
          .dp(9)
          .toFixed()
      )
    }
  }

  const assertTargetVotingYieldUnchanged = async (blockNumber: number) => {
    await assertTargetVotingYieldChanged(blockNumber, new BigNumber(0))
  }

  const getLastEpochBlock = (blockNumber: number, epoch: number) => {
    const epochNumber = Math.floor((blockNumber - 1) / epoch)
    return epochNumber * epoch
  }

  const assertGoldTokenTotalSupplyUnchanged = async (blockNumber: number) => {
    await assertGoldTokenTotalSupplyChanged(blockNumber, new BigNumber(0))
  }

  const assertGoldTokenTotalSupplyChanged = async (blockNumber: number, expected: BigNumber) => {
    const currentSupply = new BigNumber(await goldToken.methods.totalSupply().call({}, blockNumber))
    const previousSupply = new BigNumber(
      await goldToken.methods.totalSupply().call({}, blockNumber - 1)
    )
    assertAlmostEqual(currentSupply.minus(previousSupply), expected)
  }

  describe('when the validator set is changing', () => {
    let epoch: number
    const blockNumbers: number[] = []
    let validatorAccounts: string[]
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
      const groupPrivateKey = await getValidatorGroupPrivateKey()
      const rotation0PrivateKey =
        '0xa42ac9c99f6ab2c96ee6cae1b40d36187f65cd878737f6623cd363fb94ba7087'
      const rotation1PrivateKey =
        '0x4519cae145fb9499358be484ca60c80d8f5b7f9c13ff82c88ec9e13283e9de1a'
      const additionalNodes: GethInstanceConfig[] = [
        {
          name: 'validatorGroup',
          validating: false,
          syncmode: 'full',
          port: 30313,
          wsport: 8555,
          rpcport: 8557,
          privateKey: groupPrivateKey.slice(2),
          peers: [8545],
        },
      ]
      await Promise.all(
        additionalNodes.map((nodeConfig) =>
          initAndStartGeth(context.hooks.gethBinaryPath, nodeConfig)
        )
      )
      // Connect the validating nodes to the non-validating nodes, to test that announce messages
      // are properly gossiped.
      const additionalValidatingNodes = [
        {
          name: 'validator2KeyRotation0',
          validating: true,
          syncmode: 'full',
          lightserv: false,
          port: 30315,
          wsport: 8559,
          privateKey: rotation0PrivateKey.slice(2),
          peers: [8557],
        },
        {
          name: 'validator2KeyRotation1',
          validating: true,
          syncmode: 'full',
          lightserv: false,
          port: 30317,
          wsport: 8561,
          privateKey: rotation1PrivateKey.slice(2),
          peers: [8557],
        },
      ]
      await Promise.all(
        additionalValidatingNodes.map((nodeConfig) =>
          initAndStartGeth(context.hooks.gethBinaryPath, nodeConfig)
        )
      )

      validatorAccounts = await getValidatorGroupMembers()
      assert.equal(validatorAccounts.length, 5)
      epoch = new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
      assert.equal(epoch, 10)

      // Wait for an epoch transition so we can activate our vote.
      await waitForEpochTransition(epoch)
      await sleep(5)
      // Wait for an extra epoch transition to ensure everyone is connected to one another.
      await waitForEpochTransition(epoch)

      // Prepare for member swapping.
      const groupWeb3 = new Web3('ws://localhost:8555')
      await waitToFinishSyncing(groupWeb3)
      const groupKit = newKitFromWeb3(groupWeb3)
      const group: string = (await groupWeb3.eth.getAccounts())[0]
      const txos = await (await groupKit.contracts.getElection()).activate(group)
      for (const txo of txos) {
        await txo.sendAndWaitForReceipt({ from: group })
      }

      validators = await groupKit._web3Contracts.getValidators()
      const membersToSwap = [validatorAccounts[0], validatorAccounts[1]]
      const memberSwapper = await newMemberSwapper(groupKit, membersToSwap)

      // Prepare for key rotation.
      const validatorWeb3 = new Web3('http://localhost:8549')
      const authorizedWeb3s = [new Web3('ws://localhost:8559'), new Web3('ws://localhost:8561')]
      await Promise.all(authorizedWeb3s.map((w) => waitToFinishSyncing(w)))
      const authorizedPrivateKeys = [rotation0PrivateKey, rotation1PrivateKey]
      const keyRotator = await newKeyRotator(
        newKitFromWeb3(validatorWeb3),
        authorizedWeb3s,
        authorizedPrivateKeys
      )

      let errorWhileChangingValidatorSet = ''
      const changeValidatorSet = async (header: any) => {
        try {
          blockNumbers.push(header.number)
          // At the start of epoch N, perform actions so the validator set is different for epoch N + 1.
          // Note that all of these actions MUST complete within the epoch.
          if (header.number % epoch === 0 && errorWhileChangingValidatorSet === '') {
            // 1. Swap validator0 and validator1 so one is a member of the group and the other is not.
            // 2. Rotate keys for validator 2 by authorizing a new validating key.
            await Promise.all([memberSwapper.swap(), keyRotator.rotate()])
          }
        } catch (e) {
          console.error(e)
          errorWhileChangingValidatorSet = e
        }
      }

      const subscription = await groupWeb3.eth.subscribe('newBlockHeaders')
      subscription.on('data', changeValidatorSet)
      // Wait for a few epochs while changing the validator set.
      await sleep(epoch * 4)
      ;(subscription as any).unsubscribe()
      // Wait for the current epoch to complete.
      await sleep(epoch)
      assert.equal(errorWhileChangingValidatorSet, '')
    })

    const getValidatorSetSignersAtBlock = async (blockNumber: number): Promise<string[]> => {
      return election.methods.getCurrentValidatorSigners().call({}, blockNumber)
    }

    const getValidatorSetAccountsAtBlock = async (blockNumber: number) => {
      const signingKeys = await getValidatorSetSignersAtBlock(blockNumber)
      return Promise.all(
        signingKeys.map((address: string) =>
          accounts.methods.signerToAccount(address).call({}, blockNumber)
        )
      )
    }

    it('should always return a validator set size equal to the number of group members at the end of the last epoch', async () => {
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = getLastEpochBlock(blockNumber, epoch)
        const validatorSetSize = await election.methods
          .numberValidatorsInCurrentSet()
          .call({}, blockNumber)
        const groupMembership = await getValidatorGroupMembers(lastEpochBlock)
        assert.equal(validatorSetSize, groupMembership.length)
      }
    })

    it('should always return a validator set equal to the signing keys of the group members at the end of the last epoch', async function(this: any) {
      this.timeout(0)
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = getLastEpochBlock(blockNumber, epoch)
        const memberAccounts = await getValidatorGroupMembers(lastEpochBlock)
        const memberSigners = await Promise.all(
          memberAccounts.map((v: string) => getValidatorSigner(v, lastEpochBlock))
        )
        const validatorSetSigners = await getValidatorSetSignersAtBlock(blockNumber)
        const validatorSetAccounts = await getValidatorSetAccountsAtBlock(blockNumber)
        assert.sameMembers(memberSigners, validatorSetSigners)
        assert.sameMembers(memberAccounts, validatorSetAccounts)
      }
    })

    it('should block propose in a round robin fashion', async () => {
      let roundRobinOrder: string[] = []
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = getLastEpochBlock(blockNumber, epoch)
        // Fetch the round robin order if it hasn't already been set for this epoch.
        if (roundRobinOrder.length === 0 || blockNumber === lastEpochBlock + 1) {
          const validatorSet = await getValidatorSetSignersAtBlock(blockNumber)
          roundRobinOrder = await Promise.all(
            validatorSet.map(
              async (_, i) => (await web3.eth.getBlock(lastEpochBlock + i + 1)).miner
            )
          )
          assert.sameMembers(roundRobinOrder, validatorSet)
        }
        const indexInEpoch = blockNumber - lastEpochBlock - 1
        const expectedProposer = roundRobinOrder[indexInEpoch % roundRobinOrder.length]
        const block = await web3.eth.getBlock(blockNumber)
        assert.equal(block.miner.toLowerCase(), expectedProposer.toLowerCase())
      }
    })

    it('should update the validator scores at the end of each epoch', async function(this: any) {
      this.timeout(0)
      const adjustmentSpeed = fromFixed(
        new BigNumber((await validators.methods.getValidatorScoreParameters().call())[1])
      )
      const uptime = 1

      const assertScoreUnchanged = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber)).score
        )
        const previousScore = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber - 1)).score
        )
        assert.isFalse(score.isNaN())
        assert.isFalse(previousScore.isNaN())
        assert.equal(score.toFixed(), previousScore.toFixed())
      }

      const assertScoreChanged = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber)).score
        )
        const previousScore = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber - 1)).score
        )
        assert.isFalse(score.isNaN())
        assert.isFalse(previousScore.isNaN())
        const expectedScore = adjustmentSpeed
          .times(uptime)
          .plus(new BigNumber(1).minus(adjustmentSpeed).times(fromFixed(previousScore)))
        assertAlmostEqual(score, toFixed(expectedScore))
      }

      for (const blockNumber of blockNumbers) {
        let expectUnchangedScores: string[]
        let expectChangedScores: string[]
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          expectChangedScores = await getValidatorSetAccountsAtBlock(blockNumber)
          expectUnchangedScores = validatorAccounts.filter((x) => !expectChangedScores.includes(x))
        } else {
          expectUnchangedScores = validatorAccounts
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

    it('should distribute epoch payments at the end of each epoch', async function(this: any) {
      this.timeout(0)
      const commission = 0.1
      const targetValidatorEpochPayment = new BigNumber(
        await epochRewards.methods.targetValidatorEpochPayment().call()
      )
      const [group] = await validators.methods.getRegisteredValidatorGroups().call()

      const assertBalanceUnchanged = async (validator: string, blockNumber: number) => {
        await assertBalanceChanged(validator, blockNumber, new BigNumber(0), stableToken)
      }

      const getExpectedTotalPayment = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber)).score
        )
        assert.isFalse(score.isNaN())
        // We need to calculate the rewards multiplier for the previous block, before
        // the rewards actually are awarded.
        const rewardsMultiplier = new BigNumber(
          await epochRewards.methods.getRewardsMultiplier().call({}, blockNumber - 1)
        )
        return targetValidatorEpochPayment
          .times(fromFixed(score))
          .times(fromFixed(rewardsMultiplier))
      }

      for (const blockNumber of blockNumbers) {
        let expectUnchangedBalances: string[]
        let expectChangedBalances: string[]
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          expectChangedBalances = await getValidatorSetAccountsAtBlock(blockNumber)
          expectUnchangedBalances = validatorAccounts.filter(
            (x) => !expectChangedBalances.includes(x)
          )
        } else {
          expectUnchangedBalances = validatorAccounts
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
            expectedTotalPayment.minus(groupPayment),
            stableToken
          )
          expectedGroupPayment = expectedGroupPayment.plus(groupPayment)
        }
        await assertBalanceChanged(group, blockNumber, expectedGroupPayment, stableToken)
      }
    })

    it('should distribute epoch rewards at the end of each epoch', async function(this: any) {
      this.timeout(0)
      const lockedGold = await kit._web3Contracts.getLockedGold()
      const governance = await kit._web3Contracts.getGovernance()
      const gasPriceMinimum = await kit._web3Contracts.getGasPriceMinimum()
      const [group] = await validators.methods.getRegisteredValidatorGroups().call()

      const assertVotesChanged = async (blockNumber: number, expected: BigNumber) => {
        const currentVotes = new BigNumber(
          await election.methods.getTotalVotesForGroup(group).call({}, blockNumber)
        )
        const previousVotes = new BigNumber(
          await election.methods.getTotalVotesForGroup(group).call({}, blockNumber - 1)
        )
        assertAlmostEqual(currentVotes.minus(previousVotes), expected)
      }

      // Returns the gas fee base for a given block, which is distributed to the governance contract.
      const blockBaseGasFee = async (blockNumber: number): Promise<BigNumber> => {
        const gas = (await web3.eth.getBlock(blockNumber)).gasUsed
        // @ts-ignore - TODO: remove when web3 upgrade completed
        const gpm = await gasPriceMinimum.methods.gasPriceMinimum().call({}, blockNumber)
        return new BigNumber(gpm).times(new BigNumber(gas))
      }

      const assertLockedGoldBalanceChanged = async (blockNumber: number, expected: BigNumber) => {
        await assertBalanceChanged(lockedGold.options.address, blockNumber, expected, goldToken)
      }

      const assertGovernanceBalanceChanged = async (blockNumber: number, expected: BigNumber) => {
        await assertBalanceChanged(governance.options.address, blockNumber, expected, goldToken)
      }

      const assertReserveBalanceChanged = async (blockNumber: number, expected: BigNumber) => {
        await assertBalanceChanged(reserve.options.address, blockNumber, expected, goldToken)
      }

      const assertVotesUnchanged = async (blockNumber: number) => {
        await assertVotesChanged(blockNumber, new BigNumber(0))
      }

      const assertLockedGoldBalanceUnchanged = async (blockNumber: number) => {
        await assertLockedGoldBalanceChanged(blockNumber, new BigNumber(0))
      }

      const assertReserveBalanceUnchanged = async (blockNumber: number) => {
        await assertReserveBalanceChanged(blockNumber, new BigNumber(0))
      }

      const getStableTokenSupplyChange = async (blockNumber: number) => {
        const currentSupply = new BigNumber(
          await stableToken.methods.totalSupply().call({}, blockNumber)
        )
        const previousSupply = new BigNumber(
          await stableToken.methods.totalSupply().call({}, blockNumber - 1)
        )
        return currentSupply.minus(previousSupply)
      }

      const getStableTokenExchangeRate = async (blockNumber: number) => {
        const rate = await sortedOracles.methods
          .medianRate(stableToken.options.address)
          .call({}, blockNumber)
        return new BigNumber(rate[0]).div(rate[1])
      }

      for (const blockNumber of blockNumbers) {
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          // We use the number of active votes from the previous block to calculate the expected
          // epoch reward as the number of active votes for the current block will include the
          // epoch reward.
          const activeVotes = new BigNumber(
            await election.methods.getActiveVotes().call({}, blockNumber - 1)
          )
          assert.isFalse(activeVotes.isZero())
          const targetVotingYield = new BigNumber(
            (await epochRewards.methods.getTargetVotingYieldParameters().call({}, blockNumber))[0]
          )
          assert.isFalse(targetVotingYield.isZero())
          // We need to calculate the rewards multiplier for the previous block, before
          // the rewards actually are awarded.
          const rewardsMultiplier = new BigNumber(
            await epochRewards.methods.getRewardsMultiplier().call({}, blockNumber - 1)
          )
          assert.isFalse(rewardsMultiplier.isZero())
          const expectedEpochReward = activeVotes
            .times(fromFixed(targetVotingYield))
            .times(fromFixed(rewardsMultiplier))
          // TODO(joshua): Switch this over to communityRewardFraction
          const expectedInfraReward = new BigNumber(10).pow(18)
          const stableTokenSupplyChange = await getStableTokenSupplyChange(blockNumber)
          const exchangeRate = await getStableTokenExchangeRate(blockNumber)
          const expectedGoldTotalSupplyChange = expectedInfraReward
            .plus(expectedEpochReward)
            .plus(stableTokenSupplyChange.div(exchangeRate))
          await assertVotesChanged(blockNumber, expectedEpochReward)
          await assertLockedGoldBalanceChanged(blockNumber, expectedEpochReward)
          await assertGovernanceBalanceChanged(
            blockNumber,
            expectedInfraReward.plus(await blockBaseGasFee(blockNumber))
          )
          await assertReserveBalanceChanged(blockNumber, stableTokenSupplyChange.div(exchangeRate))
          await assertGoldTokenTotalSupplyChanged(blockNumber, expectedGoldTotalSupplyChange)
        } else {
          await assertVotesUnchanged(blockNumber)
          await assertGoldTokenTotalSupplyUnchanged(blockNumber)
          await assertLockedGoldBalanceUnchanged(blockNumber)
          await assertReserveBalanceUnchanged(blockNumber)
          await assertGovernanceBalanceChanged(blockNumber, await blockBaseGasFee(blockNumber))
        }
      }
    })

    it('should update the target voting yield', async () => {
      for (const blockNumber of blockNumbers) {
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          // We use the voting gold fraction from before the rewards are granted.
          const votingGoldFraction = new BigNumber(
            await epochRewards.methods.getVotingGoldFraction().call({}, blockNumber - 1)
          )
          const targetVotingGoldFraction = new BigNumber(
            await epochRewards.methods.getTargetVotingGoldFraction().call({}, blockNumber)
          )
          const difference = targetVotingGoldFraction.minus(votingGoldFraction)
          const adjustmentFactor = fromFixed(
            new BigNumber(
              (await epochRewards.methods.getTargetVotingYieldParameters().call({}, blockNumber))[2]
            )
          )
          const delta = difference.times(adjustmentFactor)
          await assertTargetVotingYieldChanged(blockNumber, delta)
        } else {
          await assertTargetVotingYieldUnchanged(blockNumber)
        }
      }
    })

    it('should have emitted the correct events when paying epoch rewards', async () => {
      const currentBlock = (await web3.eth.getBlock('latest')).number
      const events = [
        {
          contract: epochRewards,
          name: 'TargetVotingYieldUpdated',
        },
        {
          contract: validators,
          name: 'ValidatorEpochPaymentDistributed',
        },
        {
          contract: validators,
          name: 'ValidatorScoreUpdated',
        },
        {
          contract: election,
          name: 'EpochRewardsDistributedToVoters',
        },
      ]
      for (const event of events) {
        const eventLogs = await event.contract.getPastEvents(event.name, {
          fromBlock: currentBlock - 10,
          currentBlock,
        })
        assert(
          eventLogs.every((a: any) => a.blockNumber % 10 === 0),
          `every ${event.name} event occured on the last block of the epoch`
        )
        assert(eventLogs.length > 0, `at least one ${event.name} event occured`)
      }
    })
  })

  describe('when rewards distribution is frozen', () => {
    before(restart)

    let epoch: number
    let blockFrozen: number
    let latestBlock: number

    before(async function(this: any) {
      this.timeout(0)
      const validator = (await kit.web3.eth.getAccounts())[0]
      await kit.web3.eth.personal.unlockAccount(validator, '', 1000000)
      await epochRewards.methods.freeze().send({ from: validator })
      blockFrozen = await web3.eth.getBlockNumber()
      epoch = new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
      await waitForBlock(blockFrozen + epoch * 2)
      latestBlock = await web3.eth.getBlockNumber()
    })

    it('should not update the target voing yield', async () => {
      for (let blockNumber = blockFrozen; blockNumber < latestBlock; blockNumber++) {
        await assertTargetVotingYieldUnchanged(blockNumber)
      }
    })

    it('should not mint new Celo Gold', async () => {
      for (let blockNumber = blockFrozen; blockNumber < latestBlock; blockNumber++) {
        await assertGoldTokenTotalSupplyUnchanged(blockNumber)
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

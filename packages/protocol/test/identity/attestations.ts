import { NULL_ADDRESS } from '@celo/base/lib/address'
import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  assertSameAddress,
  getDerivedKey,
  getVerificationCodeSignature,
  KeyOffsets,
  mineBlocks,
  unlockAndAuthorizeKey,
} from '@celo/protocol/lib/test-utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { parseSolidityStringArray } from '@celo/utils/lib/parsing'
import BigNumber from 'bignumber.js'
import { range, uniq } from 'lodash'
import {
  AccountsContract,
  AccountsInstance,
  AttestationsTestContract,
  AttestationsTestInstance,
  MockElectionContract,
  MockElectionInstance,
  MockERC20TokenContract,
  MockERC20TokenInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockRandomContract,
  MockRandomInstance,
  MockValidatorsContract,
  RegistryContract,
  RegistryInstance,
} from 'types'
import Web3 from 'web3'
import { beforeEachWithRetries } from '../customHooks'

const Accounts: AccountsContract = artifacts.require('Accounts')
/* We use a contract that behaves like the actual Attestations contract, but
 * mocks the implementations of validator set getters. These rely on precompiled
 * contracts, which are not available in our current ganache fork, which we use
 * for Truffle unit tests.
 */
const Attestations: AttestationsTestContract = artifacts.require('AttestationsTest')
const MockERC20Token: MockERC20TokenContract = artifacts.require('MockERC20Token')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const Random: MockRandomContract = artifacts.require('MockRandom')
const Registry: RegistryContract = artifacts.require('Registry')

contract('Attestations', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let attestations: AttestationsTestInstance
  let mockERC20Token: MockERC20TokenInstance
  let otherMockERC20Token: MockERC20TokenInstance
  let random: MockRandomInstance
  let mockElection: MockElectionInstance
  let mockLockedGold: MockLockedGoldInstance
  let registry: RegistryInstance
  const web3: Web3 = new Web3('http://localhost:8545')
  const phoneNumber: string = '+18005551212'
  const caller: string = accounts[0]

  const phoneHash: string = getPhoneHash(phoneNumber)

  const attestationsRequested = 3
  const attestationExpiryBlocks = (60 * 60) / 5
  const selectIssuersWaitBlocks = 4
  const maxAttestations = 20
  const attestationFee = new BigNumber(web3.utils.toWei('.05', 'ether').toString())

  async function setAccountWalletAddress() {
    return accountsInstance.setWalletAddress(caller, '0x0', '0x0', '0x0')
  }

  const getNonIssuer = async () => {
    const issuers = await attestations.getAttestationIssuers(phoneHash, caller)
    let nonIssuerIndex = 0
    while (issuers.indexOf(accounts[nonIssuerIndex]) !== -1) {
      nonIssuerIndex++
    }
    return accounts[nonIssuerIndex]
  }

  beforeEachWithRetries('Attestations setup', 3, 3000, async () => {
    accountsInstance = await Accounts.new(true)
    mockERC20Token = await MockERC20Token.new()
    otherMockERC20Token = await MockERC20Token.new()
    const mockValidators = await MockValidators.new()
    attestations = await Attestations.new()
    random = await Random.new()
    await random.initialize(256)
    await random.addTestRandomness(0, '0x00')
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new(true)
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)

    const tokenBalance = web3.utils.toWei('10', 'ether').toString()
    await Promise.all(
      accounts.map(async (account) => {
        await mockERC20Token.mint(account, tokenBalance)
        await otherMockERC20Token.mint(account, tokenBalance)
        await accountsInstance.createAccount({ from: account })
        await unlockAndAuthorizeKey(
          KeyOffsets.VALIDATING_KEY_OFFSET,
          accountsInstance.authorizeValidatorSigner,
          account,
          accounts
        )
        await unlockAndAuthorizeKey(
          KeyOffsets.ATTESTING_KEY_OFFSET,
          accountsInstance.authorizeAttestationSigner,
          account,
          accounts
        )
      })
    )

    mockElection = await MockElection.new()
    await mockElection.setElectedValidators(
      accounts.map((account) =>
        privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account, accounts))
      )
    )
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.Random, random.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await attestations.initialize(
      registry.address,
      attestationExpiryBlocks,
      selectIssuersWaitBlocks,
      maxAttestations,
      [mockERC20Token.address, otherMockERC20Token.address],
      [attestationFee, attestationFee]
    )

    await attestations.__setValidators(
      accounts.map((account) =>
        privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account, accounts))
      )
    )
  })

  describe('#initialize()', () => {
    it('should have set attestationExpiryBlocks', async () => {
      const actualAttestationExpiryBlocks = await attestations.attestationExpiryBlocks()
      assertEqualBN(actualAttestationExpiryBlocks, attestationExpiryBlocks)
    })

    it('should have set the fee', async () => {
      const fee = await attestations.getAttestationRequestFee(mockERC20Token.address)
      assert.equal(fee.toString(), attestationFee.toString())
    })

    it('should not be callable again', async () => {
      await assertRevert(
        attestations.initialize(
          registry.address,
          attestationExpiryBlocks,
          selectIssuersWaitBlocks,
          maxAttestations,
          [mockERC20Token.address],
          [attestationFee]
        )
      )
    })
  })

  describe('#setAttestationExpirySeconds()', () => {
    const newMaxNumBlocksPerAttestation = attestationExpiryBlocks + 1

    it('should set attestationExpiryBlocks', async () => {
      await attestations.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation)
      const actualAttestationExpiryBlocks = await attestations.attestationExpiryBlocks()
      assertEqualBN(actualAttestationExpiryBlocks, newMaxNumBlocksPerAttestation)
    })

    it('should emit the AttestationExpiryBlocksSet event', async () => {
      const response = await attestations.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationExpiryBlocksSet',
        args: { value: new BigNumber(newMaxNumBlocksPerAttestation) },
      })
    })

    it('should revert when set by a non-owner', async () => {
      await assertRevert(
        attestations.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#setAttestationRequestFee()', () => {
    const newAttestationFee: BigNumber = attestationFee.plus(1)

    it('should set the fee', async () => {
      await attestations.setAttestationRequestFee(mockERC20Token.address, newAttestationFee)
      const fee = await attestations.getAttestationRequestFee(mockERC20Token.address)
      assert.equal(fee.toString(), newAttestationFee.toString())
    })

    it('should revert when the fee is being set to 0', async () => {
      await assertRevert(attestations.setAttestationRequestFee(mockERC20Token.address, 0))
    })

    it('should not be settable by a non-owner', async () => {
      await assertRevert(
        attestations.setAttestationRequestFee(mockERC20Token.address, newAttestationFee, {
          from: accounts[1],
        })
      )
    })

    it('should emit the AttestationRequestFeeSet event', async () => {
      const response = await attestations.setAttestationRequestFee(
        mockERC20Token.address,
        newAttestationFee
      )
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationRequestFeeSet',
        args: {
          token: mockERC20Token.address,
          value: newAttestationFee,
        },
      })
    })
  })

  describe('#setSelectIssuersWaitBlocks()', () => {
    const newSelectIssuersWaitBlocks = selectIssuersWaitBlocks + 1

    it('should set selectIssuersWaitBlocks', async () => {
      await attestations.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks)
      const actualAttestationExpiryBlocks = await attestations.selectIssuersWaitBlocks()
      assertEqualBN(actualAttestationExpiryBlocks, newSelectIssuersWaitBlocks)
    })

    it('should emit the SelectIssuersWaitBlocksSet event', async () => {
      const response = await attestations.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'SelectIssuersWaitBlocksSet',
        args: { value: new BigNumber(newSelectIssuersWaitBlocks) },
      })
    })

    it('should revert when set by a non-owner', async () => {
      await assertRevert(
        attestations.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#setMaxAttestations()', () => {
    const newMaxAttestations = maxAttestations + 1

    it('should set maxAttestations', async () => {
      await attestations.setMaxAttestations(newMaxAttestations)
      assertEqualBN(await attestations.maxAttestations(), newMaxAttestations)
    })

    it('should emit the MaxAttestationsSet event', async () => {
      const response = await attestations.setMaxAttestations(newMaxAttestations)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'MaxAttestationsSet',
        args: { value: new BigNumber(newMaxAttestations) },
      })
    })

    it('should revert when set by a non-owner', async () => {
      await assertRevert(
        attestations.setMaxAttestations(newMaxAttestations, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#request()', () => {
    it('should indicate an unselected attestation request', async () => {
      await attestations.request(phoneHash, attestationsRequested, mockERC20Token.address)
      const requestBlock = await web3.eth.getBlock('latest')

      const [blockNumber, actualAttestationsRequested, actualAttestationRequestFeeToken] =
        await attestations.getUnselectedRequest(phoneHash, caller)

      assertEqualBN(blockNumber, requestBlock.number)
      assertEqualBN(attestationsRequested, actualAttestationsRequested)
      assertSameAddress(actualAttestationRequestFeeToken, mockERC20Token.address)
    })

    it('should increment the number of attestations requested', async () => {
      await attestations.request(phoneHash, attestationsRequested, mockERC20Token.address)

      const [completed, total] = await attestations.getAttestationStats(phoneHash, caller)
      assertEqualBN(completed, 0)
      assertEqualBN(total, attestationsRequested)
    })

    it('should revert if 0 attestations are requested', async () => {
      await assertRevert(attestations.request(phoneHash, 0, mockERC20Token.address))
    })

    it('should emit the AttestationsRequested event', async () => {
      const response = await attestations.request(
        phoneHash,
        attestationsRequested,
        mockERC20Token.address
      )

      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationsRequested',
        args: {
          identifier: phoneHash,
          account: caller,
          attestationsRequested: new BigNumber(attestationsRequested),
          attestationRequestFeeToken: mockERC20Token.address,
        },
      })
    })

    describe('when attestations have already been requested', () => {
      beforeEach(async () => {
        await attestations.request(phoneHash, attestationsRequested, mockERC20Token.address)
      })

      describe('when the issuers have not yet been selected', () => {
        it('should revert requesting more attestations', async () => {
          await assertRevert(attestations.request(phoneHash, 1, mockERC20Token.address))
        })

        describe('when the original request has expired', () => {
          it('should allow to request more attestations', async () => {
            await mineBlocks(attestationExpiryBlocks, web3)
            await attestations.request(phoneHash, 1, mockERC20Token.address)
          })
        })

        describe('when the original request cannot be selected for due to randomness not being available', () => {
          it('should allow to request more attestations', async () => {
            const randomnessBlockRetentionWindow = await random.randomnessBlockRetentionWindow()
            await mineBlocks(randomnessBlockRetentionWindow.toNumber(), web3)
            await attestations.request(phoneHash, 1, mockERC20Token.address)
          })
        })
      })

      describe('when the issuers have been selected', () => {
        beforeEach(async () => {
          const requestBlockNumber = await web3.eth.getBlockNumber()
          await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
          await attestations.selectIssuers(phoneHash)
        })

        it('should allow to request more attestations', async () => {
          await attestations.request(phoneHash, 1, mockERC20Token.address)
          const [completed, total] = await attestations.getAttestationStats(phoneHash, caller)
          assert.equal(completed.toNumber(), 0)
          assert.equal(total.toNumber(), attestationsRequested + 1)
        })
      })
    })
  })

  describe('#selectIssuers()', () => {
    let expectedRequestBlockNumber: number

    describe('when half the validator set does not authorize an attestation key', () => {
      const accountsThatOptedIn = accounts.slice(0, 5)

      beforeEach(async () => {
        await Promise.all(
          accounts
            .slice(5, 10)
            .map(async (account) => accountsInstance.removeAttestationSigner({ from: account }))
        )
      })

      it('does not select among those when requesting 5', async () => {
        await attestations.request(phoneHash, 5, mockERC20Token.address)
        const requestBlockNumber = await web3.eth.getBlockNumber()
        await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
        await attestations.selectIssuers(phoneHash)

        const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)
        assert.includeMembers(accountsThatOptedIn, attestationIssuers)
      })
    })

    describe('when attestations were requested', () => {
      beforeEach(async () => {
        await attestations.request(phoneHash, attestationsRequested, mockERC20Token.address)
        expectedRequestBlockNumber = await web3.eth.getBlockNumber()
      })

      // These tests/functionality implicitly relies on randomness to only be available
      // historically. The attestation contract itself will not test that the current block
      //  number is sufficiently in the future after the request block
      describe('when the randomness of the right block has been set', () => {
        beforeEach(async () => {
          const requestBlockNumber = await web3.eth.getBlockNumber()
          await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
        })

        it('should add the correct number attestation issuers', async () => {
          assert.isEmpty(await attestations.getAttestationIssuers(phoneHash, caller))
          await attestations.selectIssuers(phoneHash)

          const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)
          assert.lengthOf(attestationIssuers, attestationsRequested)
          assert.lengthOf(uniq(attestationIssuers), attestationsRequested)
        })

        it('should set the block of request in the attestation', async () => {
          await attestations.selectIssuers(phoneHash)
          const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)

          await Promise.all(
            attestationIssuers.map(async (issuer) => {
              const [status, requestBlock] = await attestations.getAttestationState(
                phoneHash,
                caller,
                issuer
              )

              assert.equal(status.toNumber(), 1)
              assert.equal(requestBlock.toNumber(), expectedRequestBlockNumber)
            })
          )
        })

        it('should return the attestations in getCompletableAttestations', async () => {
          await Promise.all(
            accounts.map((account) =>
              accountsInstance.setMetadataURL(`https://test.com/${account}`, { from: account })
            )
          )
          await attestations.selectIssuers(phoneHash)
          const [attestationBlockNumbers, attestationIssuers, stringLengths, stringData] =
            await attestations.getCompletableAttestations(phoneHash, caller)

          const urls = parseSolidityStringArray(
            stringLengths.map((x) => x.toNumber()),
            stringData as unknown as string
          )

          assert.lengthOf(attestationBlockNumbers, attestationsRequested)
          await Promise.all(
            range(0, attestationsRequested).map(async (i) => {
              const [status, requestBlock] = await attestations.getAttestationState(
                phoneHash,
                caller,
                attestationIssuers[i]!
              )
              assert.equal(status.toNumber(), 1)
              assertEqualBN(requestBlock, attestationBlockNumbers[i])
              assert.equal(`https://test.com/${attestationIssuers[i]}`, urls[i])
            })
          )
        })

        it('should delete the unselected request', async () => {
          await attestations.selectIssuers(phoneHash)
          const [blockNumber, actualAttestationsRequested] =
            await attestations.getUnselectedRequest(phoneHash, caller)
          assertEqualBN(blockNumber, 0)
          assertEqualBN(actualAttestationsRequested, 0)
        })

        it('should emit the AttestationIssuerSelected event', async () => {
          const response = await attestations.selectIssuers(phoneHash)
          const issuers = await attestations.getAttestationIssuers(phoneHash, caller)
          assert.lengthOf(response.logs, 3)

          issuers.forEach((issuer, index) => {
            assertLogMatches2(response.logs[index], {
              event: 'AttestationIssuerSelected',
              args: {
                identifier: phoneHash,
                account: caller,
                issuer,
                attestationRequestFeeToken: mockERC20Token.address,
              },
            })
          })
        })

        describe('when more attestations were requested', () => {
          beforeEach(async () => {
            await attestations.selectIssuers(phoneHash)
            await attestations.request(phoneHash, 8, mockERC20Token.address)
            expectedRequestBlockNumber = await web3.eth.getBlockNumber()
            const requestBlockNumber = await web3.eth.getBlockNumber()
            await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
          })

          it('should revert if too many issuers attempted', async () => {
            await assertRevert(attestations.selectIssuers(phoneHash))
          })
        })

        describe('after attestationExpiryBlocks', () => {
          beforeEach(async () => {
            await attestations.selectIssuers(phoneHash)
            await mineBlocks(attestationExpiryBlocks, web3)
          })

          it('should no longer list the attestations in getCompletableAttestations', async () => {
            const [attestationBlockNumbers] = await attestations.getCompletableAttestations(
              phoneHash,
              caller
            )

            assert.lengthOf(attestationBlockNumbers, 0)
          })
        })

        describe('when the validation key has been rotated for all validators', () => {
          // Rotate all validation keys
          beforeEach(async () => {
            await Promise.all(
              accounts.map((account) =>
                unlockAndAuthorizeKey(
                  KeyOffsets.NEW_VALIDATING_KEY_OFFSET,
                  accountsInstance.authorizeValidatorSigner,
                  account,
                  accounts
                )
              )
            )
          })

          it('can still select issuers', async () => {
            assert.isEmpty(await attestations.getAttestationIssuers(phoneHash, caller))
            await attestations.selectIssuers(phoneHash)

            const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)
            assert.lengthOf(attestationIssuers, attestationsRequested)
          })
        })
      })

      it('should revert when selecting too soon', async () => {
        const requestBlockNumber = await web3.eth.getBlockNumber()
        await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks - 1, '0x1')
        await assertRevert(attestations.selectIssuers(phoneHash))
      })
    })

    describe('without requesting attestations before', () => {
      it('should revert when selecting issuers', async () => {
        await assertRevert(attestations.selectIssuers(phoneHash))
      })
    })
  })

  describe('#complete()', () => {
    let issuer: string
    let v: number
    let r: string
    let s: string

    beforeEach(async () => {
      await requestAttestations()
      issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
      ;({ v, r, s } = await getVerificationCodeSignature(caller, issuer, phoneHash, accounts))
    })

    it('should add the account to the list upon completion', async () => {
      let attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
      assert.isEmpty(attestedAccounts)

      await attestations.complete(phoneHash, v, r, s)
      attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
      assert.lengthOf(attestedAccounts, 1)
      assert.equal(attestedAccounts[0], caller)
    })

    it('should not add the account twice to the list', async () => {
      await attestations.complete(phoneHash, v, r, s)
      const secondIssuer = (await attestations.getAttestationIssuers(phoneHash, caller))[1]
      ;({ v, r, s } = await getVerificationCodeSignature(caller, secondIssuer, phoneHash, accounts))

      await attestations.complete(phoneHash, v, r, s)
      const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
      assert.lengthOf(attestedAccounts, 1)
      assert.equal(attestedAccounts[0], caller)
    })

    it('should increment the number of completed verification requests', async () => {
      const [numCompleted] = await attestations.getAttestationStats(phoneHash, caller)
      assert.equal(numCompleted.toNumber(), 0)

      await attestations.complete(phoneHash, v, r, s)
      const [numCompleted2, numTotal] = await attestations.getAttestationStats(phoneHash, caller)
      assert.equal(numCompleted2.toNumber(), 1)
      assert.equal(numTotal.toNumber(), attestationsRequested)
    })

    it('should set the time of the successful completion', async () => {
      await mineBlocks(1, web3)
      await attestations.complete(phoneHash, v, r, s)

      const expectedBlock = await web3.eth.getBlock('latest')

      const [status, completionBlock, actualAttestationRequestFeeToken] =
        await attestations.getAttestationState(phoneHash, caller, issuer)

      assert.equal(status.toNumber(), 2)
      assert.equal(completionBlock.toNumber(), expectedBlock.number)
      assertSameAddress(actualAttestationRequestFeeToken, NULL_ADDRESS)
    })

    it('should increment pendingWithdrawals for the rewards recipient', async () => {
      await attestations.complete(phoneHash, v, r, s)
      const pendingWithdrawals = await attestations.pendingWithdrawals(
        mockERC20Token.address,
        issuer
      )
      assert.equal(pendingWithdrawals.toString(), attestationFee.toString())
    })

    it('should no longer list the attestation in getCompletableAttestationStats', async () => {
      await attestations.complete(phoneHash, v, r, s)
      const [attestationIssuers] = await attestations.getCompletableAttestations(phoneHash, caller)
      assert.equal(attestationIssuers.indexOf(new BigNumber(issuer)), -1)
    })

    it('should emit the AttestationCompleted event', async () => {
      const response = await attestations.complete(phoneHash, v, r, s)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationCompleted',
        args: {
          identifier: phoneHash,
          account: caller,
          issuer,
        },
      })
    })

    it('should revert when an invalid attestation code is provided', async () => {
      ;({ v, r, s } = await getVerificationCodeSignature(accounts[1], issuer, phoneHash, accounts))
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })

    it('should revert with a non-requested issuer', async () => {
      ;({ v, r, s } = await getVerificationCodeSignature(
        caller,
        await getNonIssuer(),
        phoneHash,
        accounts
      ))
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })

    it('should revert an already completed request', async () => {
      await attestations.complete(phoneHash, v, r, s)
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })

    it('does not let you verify beyond the window', async () => {
      await mineBlocks(attestationExpiryBlocks, web3)
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })
  })

  describe('#withdraw()', () => {
    let issuer: string
    beforeEach(async () => {
      await requestAttestations()
      issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
      const { v, r, s } = await getVerificationCodeSignature(caller, issuer, phoneHash, accounts)
      await attestations.complete(phoneHash, v, r, s)
      await mockERC20Token.mint(attestations.address, attestationFee)
    })

    it('should remove the balance of available rewards for the issuer from issuer', async () => {
      await attestations.withdraw(mockERC20Token.address, {
        from: issuer,
      })
      const pendingWithdrawals = await attestations.pendingWithdrawals(
        mockERC20Token.address,
        issuer
      )
      assertEqualBN(pendingWithdrawals, 0)
    })

    it('should remove the balance of available rewards for the issuer from attestation signer', async () => {
      const signer = await accountsInstance.getAttestationSigner(issuer)
      await attestations.withdraw(mockERC20Token.address, {
        from: signer,
      })
      const pendingWithdrawals = await attestations.pendingWithdrawals(
        mockERC20Token.address,
        issuer
      )
      assertEqualBN(pendingWithdrawals, 0)
    })

    it('should revert from non-attestation signer or issuer account', async () => {
      await unlockAndAuthorizeKey(
        KeyOffsets.VOTING_KEY_OFFSET,
        accountsInstance.authorizeVoteSigner,
        issuer,
        accounts
      )
      const signer = await accountsInstance.getVoteSigner(issuer)
      await assertRevert(attestations.withdraw(mockERC20Token.address, { from: signer }))
    })

    it('should emit the Withdrawal event', async () => {
      const response = await attestations.withdraw(mockERC20Token.address, {
        from: issuer,
      })
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'Withdrawal',
        args: {
          account: issuer,
          token: mockERC20Token.address,
          amount: attestationFee,
        },
      })
    })

    it('should not allow someone with no pending withdrawals to withdraw', async () => {
      await assertRevert(
        attestations.withdraw(mockERC20Token.address, { from: await getNonIssuer() })
      )
    })
  })

  const requestAttestations = async () => {
    await attestations.request(phoneHash, attestationsRequested, mockERC20Token.address)
    const requestBlockNumber = await web3.eth.getBlockNumber()
    await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
    await attestations.selectIssuers(phoneHash)
  }
  const requestAndCompleteAttestations = async () => {
    await requestAttestations()
    const issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
    const { v, r, s } = await getVerificationCodeSignature(caller, issuer, phoneHash, accounts)
    await attestations.complete(phoneHash, v, r, s)
  }

  describe('#lookupAccountsForIdentifier()', () => {
    describe('when an account has a claim', () => {
      beforeEach(async () => {
        await requestAttestations()
      })

      it("does not return the user's account", async () => {
        const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
        assert.isEmpty(attestedAccounts)
      })
    })

    describe('when an account has an attestation', () => {
      beforeEach(async () => {
        await requestAndCompleteAttestations()
      })

      describe('when the account has no walletAddress mapped', () => {
        it('should allow a user to lookup the attested account of a phone number', async () => {
          const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
          assert.deepEqual(attestedAccounts, [caller])
        })
      })

      describe('when the account has a walletAddress mapped', () => {
        beforeEach(setAccountWalletAddress)

        it('should allow a user to lookup the attested account of a phone number', async () => {
          const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
          assert.deepEqual(attestedAccounts, [caller])
        })
      })
    })

    describe('when an account is not attested', () => {
      it('should return an empty array for the phone number', async () => {
        const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
        assert.isEmpty(attestedAccounts)
      })
    })
  })

  describe('#batchGetAttestationStats()', () => {
    describe('when an account has a claim and is mapped with a walletAddress', () => {
      beforeEach(async () => {
        await requestAttestations()
        await setAccountWalletAddress()
      })

      it("does not return the user's account", async () => {
        const [matches, addresses, completed, total]: [
          BigNumber[],
          string[],
          BigNumber[],
          BigNumber[]
        ] = await attestations.batchGetAttestationStats([phoneHash])
        assert.lengthOf(matches, 1)
        assert.lengthOf(addresses, 0)
        assert.lengthOf(completed, 0)
        assert.lengthOf(total, 0)
        assert.equal(matches[0].toNumber(), 0)
      })
    })

    describe('when an account has an attestation', () => {
      beforeEach(async () => {
        await requestAndCompleteAttestations()
      })

      describe('when the account has a walletAddress mapped', () => {
        beforeEach(setAccountWalletAddress)

        it('should allow a user to lookup the attested account of a phone number', async () => {
          const [matches, addresses, completed, total]: [
            BigNumber[],
            string[],
            BigNumber[],
            BigNumber[]
          ] = await attestations.batchGetAttestationStats([phoneHash])
          assert.lengthOf(matches, 1)
          assert.lengthOf(addresses, 1)
          assert.lengthOf(completed, 1)
          assert.lengthOf(total, 1)

          assert.equal(matches[0].toNumber(), 1)
          assert.equal(addresses[0], caller)
          assert.equal(completed[0].toNumber(), 1)
          assert.equal(total[0].toNumber(), 3)
        })

        describe('and another account also has an attestation to the same phone number', () => {
          let other
          beforeEach(async () => {
            other = accounts[1]
            await attestations.request(phoneHash, attestationsRequested, mockERC20Token.address, {
              from: other,
            })
            const requestBlockNumber = await web3.eth.getBlockNumber()
            await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
            await attestations.selectIssuers(phoneHash, { from: other })

            const issuer = (await attestations.getAttestationIssuers(phoneHash, other))[0]
            const { v, r, s } = await getVerificationCodeSignature(
              other,
              issuer,
              phoneHash,
              accounts
            )
            await attestations.complete(phoneHash, v, r, s, { from: other })
            await accountsInstance.setWalletAddress(other, '0x0', '0x0', '0x0', { from: other })
          })

          it('should return multiple attested accounts', async () => {
            await attestations.batchGetAttestationStats([phoneHash])

            const [matches, addresses, completed, total]: [
              BigNumber[],
              string[],
              BigNumber[],
              BigNumber[]
            ] = await attestations.batchGetAttestationStats([phoneHash])
            assert.lengthOf(matches, 1)
            assert.lengthOf(addresses, 2)
            assert.lengthOf(completed, 2)
            assert.lengthOf(total, 2)

            assert.equal(matches[0].toNumber(), 2)
            assert.equal(addresses[0], caller)
            assert.equal(addresses[1], other)
            assert.equal(completed[0].toNumber(), 1)
            assert.equal(total[0].toNumber(), 3)
            assert.equal(completed[1].toNumber(), 1)
            assert.equal(total[1].toNumber(), 3)
          })
        })
      })

      describe('when the account has no walletAddress mapped', () => {
        it("returns the user's account with a zeroAddress", async () => {
          const [matches, addresses, completed, total]: [
            BigNumber[],
            string[],
            BigNumber[],
            BigNumber[]
          ] = await attestations.batchGetAttestationStats([phoneHash])
          assert.lengthOf(matches, 1)
          assert.lengthOf(addresses, 1)
          assert.lengthOf(completed, 1)
          assert.lengthOf(total, 1)

          assert.equal(matches[0].toNumber(), 1)
          assert.equal(addresses[0], NULL_ADDRESS)
          assert.equal(completed[0].toNumber(), 1)
          assert.equal(total[0].toNumber(), 3)
        })
      })
    })

    describe('when an account is not claimed', () => {
      it('returns no results', async () => {
        const [matches, addresses, completed, total]: [
          BigNumber[],
          string[],
          BigNumber[],
          BigNumber[]
        ] = await attestations.batchGetAttestationStats([phoneHash])
        assert.lengthOf(matches, 1)
        assert.lengthOf(addresses, 0)
        assert.lengthOf(completed, 0)
        assert.lengthOf(total, 0)
        assert.equal(matches[0].toNumber(), 0)
      })
    })
  })

  describe('#revoke()', () => {
    beforeEach(async () => {
      await requestAndCompleteAttestations()
    })

    it('should allow a user to revoke their account for a phone number', async () => {
      await attestations.revoke(phoneHash, 0)
      const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
      assert.isEmpty(attestedAccounts)
      const [matches, addresses, completed, total]: [
        BigNumber[],
        string[],
        BigNumber[],
        BigNumber[]
      ] = await attestations.batchGetAttestationStats([phoneHash])
      assert.lengthOf(matches, 1)
      assert.lengthOf(addresses, 0)
      assert.lengthOf(completed, 0)
      assert.lengthOf(total, 0)
    })
  })

  describe('#requireNAttestationRequests()', () => {
    const requestNError = 'requested attestations does not match expected'

    describe('with none requested', () => {
      it('does not revert when called with 0', async () => {
        await attestations.requireNAttestationsRequested(phoneHash, caller, 0)
      })

      it('does revert when called with something else', async () => {
        await assertRevert(
          attestations.requireNAttestationsRequested(phoneHash, caller, 2),
          requestNError
        )
      })
    })

    describe('with some requested', () => {
      beforeEach(async () => {
        await requestAttestations()
      })

      it('does revert when called with 0', async () => {
        await assertRevert(
          attestations.requireNAttestationsRequested(phoneHash, caller, 0),
          requestNError
        )
      })

      it('does not revert when called with the correct number', async () => {
        await attestations.requireNAttestationsRequested(phoneHash, caller, attestationsRequested)
      })
    })
  })

  describe('#approveTransfer()', () => {
    const replacementAddress: string = accounts[1]
    describe('when the attestation exists', () => {
      beforeEach(async () => {
        await requestAndCompleteAttestations()
      })

      it('should allow a user to change their mapped address when approved in the order from-->to', async () => {
        const originalAttestationStats = await attestations.getAttestationStats(phoneHash, caller)
        const originalUnselectedRequest = await attestations.getUnselectedRequest(phoneHash, caller)
        await attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
          from: caller,
        })
        const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
        await assert.deepEqual(attestedAccounts, [caller])
        await attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
          from: replacementAddress,
        })
        const attestedAccountsAfterApproval = await attestations.lookupAccountsForIdentifier(
          phoneHash
        )
        assert.deepEqual(attestedAccountsAfterApproval, [replacementAddress])
        const newAttestationStats = await attestations.getAttestationStats(
          phoneHash,
          replacementAddress
        )
        const newUnselectedRequest = await attestations.getUnselectedRequest(
          phoneHash,
          replacementAddress
        )
        assert.deepEqual(originalAttestationStats, newAttestationStats)
        assert.deepEqual(originalUnselectedRequest, newUnselectedRequest)
      })

      it('should allow a user to change their mapped address when approved in the order to-->from', async () => {
        const originalAttestationStats = await attestations.getAttestationStats(phoneHash, caller)
        const originalUnselectedRequest = await attestations.getUnselectedRequest(phoneHash, caller)
        await attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
          from: replacementAddress,
        })
        const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
        await assert.deepEqual(attestedAccounts, [caller])
        await attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
          from: caller,
        })
        const attestedAccountsAfterApproval = await attestations.lookupAccountsForIdentifier(
          phoneHash
        )
        assert.deepEqual(attestedAccountsAfterApproval, [replacementAddress])
        const newAttestationStats = await attestations.getAttestationStats(
          phoneHash,
          replacementAddress
        )
        const newUnselectedRequest = await attestations.getUnselectedRequest(
          phoneHash,
          replacementAddress
        )
        assert.deepEqual(originalAttestationStats, newAttestationStats)
        assert.deepEqual(originalUnselectedRequest, newUnselectedRequest)
      })

      it('should allow a user to revoke their approval', async () => {
        await attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
          from: caller,
        })
        await attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, false, {
          from: caller,
        })
        await attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
          from: replacementAddress,
        })
        const [completed, requested] = await attestations.getAttestationStats(
          phoneHash,
          replacementAddress
        )
        assertEqualBN(completed, 0)
        assertEqualBN(requested, 0)
      })

      it('should revert if the caller is not one of the two parties', async () => {
        const otherAddress: string = accounts[2]
        await assertRevert(
          attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
            from: otherAddress,
          })
        )
      })

      it('should revert when the `to` address has attestations existing', async () => {
        await attestations.request(phoneHash, attestationsRequested, mockERC20Token.address, {
          from: replacementAddress,
        })
        const requestBlockNumber = await web3.eth.getBlockNumber()
        await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
        await attestations.selectIssuers(phoneHash, { from: replacementAddress })

        const issuer = (
          await attestations.getAttestationIssuers(phoneHash, replacementAddress, {
            from: replacementAddress,
          })
        )[0]
        const { v, r, s } = await getVerificationCodeSignature(
          replacementAddress,
          issuer,
          phoneHash,
          accounts
        )
        await attestations.complete(phoneHash, v, r, s, { from: replacementAddress })
        await attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
          from: replacementAddress,
        })
        await attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
          from: replacementAddress,
        })
        await assertRevert(
          attestations.approveTransfer(phoneHash, 0, caller, replacementAddress, true, {
            from: caller,
          }),
          'Address tranferring to has already requested attestations'
        )
      })
    })
  })
})

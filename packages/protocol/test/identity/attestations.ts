import Web3 = require('web3')

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertLogMatches2,
  assertRevert,
  NULL_ADDRESS,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { attestToIdentifier } from '@celo/utils'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import BigNumber from 'bignumber.js'
import { uniq } from 'lodash'
import {
  AttestationsContract,
  AttestationsInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RandomContract,
  RandomInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const Attestations: AttestationsContract = artifacts.require('Attestations')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const Random: RandomContract = artifacts.require('Random')
const Registry: RegistryContract = artifacts.require('Registry')

const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
const longDataEncryptionKey =
  '0x04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111' +
  '02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

contract('Attestations', (accounts: string[]) => {
  let attestations: AttestationsInstance
  let mockStableToken: MockStableTokenInstance
  let otherMockStableToken: MockStableTokenInstance
  let random: RandomInstance
  let mockValidators: MockValidatorsInstance
  let registry: RegistryInstance
  const provider = new Web3.providers.HttpProvider('http://localhost:8545')
  const metadataURL = 'https://www.celo.org'
  const web3: Web3 = new Web3(provider)
  const phoneNumber: string = '+18005551212'
  const caller: string = accounts[0]
  // Private keys of each of the 10 miners, in the same order as their addresses in 'accounts'.
  const accountPrivateKeys: string[] = [
    '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
    '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72',
    '0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1',
    '0xff12e391b79415e941a94de3bf3a9aee577aed0731e297d5cfa0b8a1e02fa1d0',
    '0x752dd9cf65e68cfaba7d60225cbdbc1f4729dd5e5507def72815ed0d8abc6249',
    '0xefb595a0178eb79a8df953f87c5148402a224cdf725e88c0146727c6aceadccd',
    '0x83c6d2cc5ddcf9711a6d59b417dc20eb48afd58d45290099e5987e3d768f328f',
    '0xbb2d3f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2',
    '0xb2fd4d29c1390b71b8795ae81196bfd60293adf99f9d32a0aff06288fcdac55f',
    '0x23cb7121166b9a2f93ae0b7c05bde02eae50d64449b2cbb42bc84e9d38d6cc89',
  ]

  const phoneHash: string = getPhoneHash(phoneNumber)

  const attestationsRequested = 3
  const attestationExpirySeconds = 60
  const attestationFee = new BigNumber(web3.utils.toWei('.05', 'ether').toString())

  async function getVerificationCodeSignature(
    account: string,
    issuer: string
  ): Promise<[number, string, string]> {
    const privateKey = accountPrivateKeys[accounts.indexOf(issuer)]
    const { v, r, s } = attestToIdentifier(phoneNumber, account, privateKey)
    return [v, r, s]
  }

  async function setAccountWalletAddress() {
    return attestations.setWalletAddress(caller)
  }

  const getNonIssuer = async () => {
    const issuers = await attestations.getAttestationIssuers(phoneHash, caller)
    let nonIssuerIndex = 0
    while (issuers.indexOf(accounts[nonIssuerIndex]) !== -1) {
      nonIssuerIndex++
    }
    return accounts[nonIssuerIndex]
  }

  beforeEach(async () => {
    mockStableToken = await MockStableToken.new()
    otherMockStableToken = await MockStableToken.new()
    attestations = await Attestations.new()
    random = await Random.new()
    mockValidators = await MockValidators.new()
    await Promise.all(accounts.map((account) => mockValidators.addValidator(account)))
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Random, random.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)

    await attestations.initialize(
      registry.address,
      attestationExpirySeconds,
      [mockStableToken.address, otherMockStableToken.address],
      [attestationFee, attestationFee]
    )
  })

  describe('#initialize()', () => {
    it('should have set attestationExpirySeconds', async () => {
      const actualAttestationExpirySeconds: number = await attestations.attestationExpirySeconds.call(
        this
      )
      assert.equal(actualAttestationExpirySeconds, attestationExpirySeconds)
    })

    it('should have set the fee', async () => {
      const fee = await attestations.getAttestationRequestFee.call(mockStableToken.address)
      assert.equal(fee.toString(), attestationFee.toString())
    })

    it('should not be callable again', async () => {
      await assertRevert(
        attestations.initialize(
          registry.address,
          attestationExpirySeconds,
          [mockStableToken.address],
          [attestationFee]
        )
      )
    })
  })

  describe('#setAccountDataEncryptionKey()', () => {
    it('should set dataEncryptionKey', async () => {
      // @ts-ignore
      await attestations.setAccountDataEncryptionKey(dataEncryptionKey)
      // @ts-ignore
      const fetchedKey: string = await attestations.getDataEncryptionKey(caller)
      assert.equal(fetchedKey, dataEncryptionKey)
    })

    it('should allow setting a key with leading zeros', async () => {
      const keyWithZeros = '0x00000000000000000000000000000000000000000000000f2f48ee19680706191111'
      // @ts-ignore
      await attestations.setAccountDataEncryptionKey(keyWithZeros)
      // @ts-ignore
      const fetchedKey: string = await attestations.getDataEncryptionKey(caller)
      assert.equal(fetchedKey, keyWithZeros)
    })

    it('should revert when the key is invalid', async () => {
      // @ts-ignore
      await assertRevert(attestations.setAccountDataEncryptionKey('0x32132931293'))
    })

    it('should allow a key that is longer than 33 bytes', async () => {
      // @ts-ignore
      await attestations.setAccountDataEncryptionKey(longDataEncryptionKey)
      // @ts-ignore
      const fetchedKey: string = await attestations.getDataEncryptionKey(caller)
      assert.equal(fetchedKey, longDataEncryptionKey)
    })

    it('should emit the AccountDataEncryptionKeySet event', async () => {
      // @ts-ignore
      const response = await attestations.setAccountDataEncryptionKey(dataEncryptionKey)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AccountDataEncryptionKeySet',
        args: { account: caller, dataEncryptionKey },
      })
    })
  })

  describe('#setAccount', async () => {
    it('should set the dataEncryptionKey and walletAddress', async () => {
      // @ts-ignore
      await attestations.setAccount(dataEncryptionKey, caller)
      const expectedWalletAddress = await attestations.getWalletAddress(caller)
      assert.equal(expectedWalletAddress, caller)
      const expectedKey = await attestations.getDataEncryptionKey(caller)
      // @ts-ignore
      assert.equal(expectedKey, dataEncryptionKey)
    })
  })

  describe('#setWalletAddress', async () => {
    it('should set the walletAddress', async () => {
      await attestations.setWalletAddress(caller)
      const result = await attestations.getWalletAddress(caller)
      assert.equal(result, caller)
    })

    it('should set the NULL_ADDRESS', async () => {
      await attestations.setWalletAddress(NULL_ADDRESS)
      const result = await attestations.getWalletAddress(caller)
      assert.equal(result, NULL_ADDRESS)
    })

    it('should emit the AccountWalletAddressSet event', async () => {
      const response = await attestations.setWalletAddress(caller)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AccountWalletAddressSet',
        args: { account: caller, walletAddress: caller },
      })
    })
  })

  describe('#setAttestationExpirySeconds()', () => {
    const newMaxNumBlocksPerAttestation = attestationExpirySeconds + 1

    it('should set attestationExpirySeconds', async () => {
      await attestations.setAttestationExpirySeconds(newMaxNumBlocksPerAttestation)
      const actualAttestationExpirySeconds = await attestations.attestationExpirySeconds.call(this)
      assert.equal(actualAttestationExpirySeconds, newMaxNumBlocksPerAttestation)
    })

    it('should emit the AttestationExpirySecondsSet event', async () => {
      const response = await attestations.setAttestationExpirySeconds(newMaxNumBlocksPerAttestation)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationExpirySecondsSet',
        args: { value: new BigNumber(newMaxNumBlocksPerAttestation) },
      })
    })

    it('should revert when set by a non-owner', async () => {
      await assertRevert(
        attestations.setAttestationExpirySeconds(newMaxNumBlocksPerAttestation, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#setAttestationRequestFee()', () => {
    const newAttestationFee: BigNumber = attestationFee.plus(1)

    it('should set the fee', async () => {
      await attestations.setAttestationRequestFee(mockStableToken.address, newAttestationFee)
      const fee = await attestations.getAttestationRequestFee.call(mockStableToken.address)
      assert.equal(fee.toString(), newAttestationFee.toString())
    })

    it('should revert when the fee is being set to 0', async () => {
      await assertRevert(attestations.setAttestationRequestFee(mockStableToken.address, 0))
    })

    it('should not be settable by a non-owner', async () => {
      await assertRevert(
        attestations.setAttestationRequestFee(mockStableToken.address, newAttestationFee, {
          from: accounts[1],
        })
      )
    })

    it('should emit the AttestationRequestFeeSet event', async () => {
      const response = await attestations.setAttestationRequestFee(
        mockStableToken.address,
        newAttestationFee
      )
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationRequestFeeSet',
        args: {
          token: mockStableToken.address,
          value: newAttestationFee,
        },
      })
    })
  })

  describe('#request()', () => {
    it('should increment the number of attestations requested', async () => {
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)

      const [completed, total] = await attestations.getAttestationStats(phoneHash, caller)
      assert.equal(completed.toNumber(), 0)
      assert.equal(total.toNumber(), attestationsRequested)
    })

    it('should set the mostRecentAttestationRequested timestamp', async () => {
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)

      const requestBlock = await web3.eth.getBlock('latest')
      const mostRecentAttestationRequested = await attestations.getMostRecentAttestationRequest(
        caller
      )

      assert.equal(requestBlock.timestamp.toString(), mostRecentAttestationRequested.toString())
    })

    it('should add the correct number attestation issuers', async () => {
      assert.isEmpty(await attestations.getAttestationIssuers(phoneHash, caller))
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)

      const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)
      assert.lengthOf(attestationIssuers, attestationsRequested)
      assert.lengthOf(uniq(attestationIssuers), attestationsRequested)
    })

    it('should set the block of request', async () => {
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)

      const expectedBlock = await web3.eth.getBlock('latest')

      const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)

      await Promise.all(
        attestationIssuers.map(async (issuer) => {
          const [status, time] = await attestations.getAttestationState(phoneHash, caller, issuer)

          assert.equal(status.toNumber(), 1)
          assert.equal(time.toNumber(), expectedBlock.timestamp)
        })
      )
    })

    it('should set the attestationRequestFeeToken', async () => {
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)

      const token = await attestations.getAttestationRequestFeeToken(caller)
      assert.equal(token, mockStableToken.address)
    })

    it('should revert if 0 attestations are requested', async () => {
      await assertRevert(attestations.request(phoneHash, 0, mockStableToken.address))
    })

    it('should emit the AttestationsRequested event', async () => {
      const response = await attestations.request(
        phoneHash,
        attestationsRequested,
        mockStableToken.address
      )

      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationsRequested',
        args: {
          identifier: phoneHash,
          account: caller,
          attestationsRequested: new BigNumber(attestationsRequested),
          attestationRequestFeeToken: mockStableToken.address,
        },
      })
    })

    describe('when attestations have already been requested', async () => {
      beforeEach(async () => {
        await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)
      })

      it('should allow to request more attestations', async () => {
        await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)

        const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)

        assert.lengthOf(attestationIssuers, attestationsRequested * 2)
        assert.lengthOf(uniq(attestationIssuers), attestationsRequested * 2)
      })

      it('should revert if a different fee token is provided', async () => {
        await assertRevert(
          attestations.request(phoneHash, attestationsRequested, otherMockStableToken.address)
        )
      })

      describe('if attestationExpirySeconds has passed', async () => {
        beforeEach(async () => {
          await timeTravel(attestationExpirySeconds + 1, web3)
        })

        it('should allow using a different attestationRequestFeeToken', async () => {
          await attestations.request(phoneHash, attestationsRequested, otherMockStableToken.address)

          const newFeeToken = await attestations.getAttestationRequestFeeToken(caller)
          assert.equal(newFeeToken, otherMockStableToken.address)
        })
      })
    })
  })

  describe('#reveal()', () => {
    let issuer: string

    beforeEach(async () => {
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)
      issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
    })

    it('should allow a reveal', async () => {
      // @ts-ignore
      await attestations.reveal(phoneHash, phoneHash, issuer, false)
    })

    it('should revert if users reveal a non-existent attestation request', async () => {
      // @ts-ignore
      await assertRevert(attestations.reveal(phoneHash, phoneHash, await getNonIssuer(), false))
    })

    it('should revert if a user reveals a request that has been completed', async () => {
      const [v, r, s] = await getVerificationCodeSignature(caller, issuer)
      await attestations.complete(phoneHash, v, r, s)

      // @ts-ignore
      await assertRevert(attestations.reveal(phoneHash, phoneHash, issuer, false))
    })

    it('should revert if the request as expired', async () => {
      await timeTravel(attestationExpirySeconds, web3)
      // @ts-ignore
      await assertRevert(attestations.reveal(phoneHash, phoneHash, issuer, false))
    })
  })

  describe('#complete()', () => {
    let issuer: string
    let v: number
    let r: string, s: string
    beforeEach(async () => {
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)
      issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
      ;[v, r, s] = await getVerificationCodeSignature(caller, issuer)
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
      ;[v, r, s] = await getVerificationCodeSignature(caller, secondIssuer)

      await attestations.complete(phoneHash, v, r, s)
      const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
      assert.lengthOf(attestedAccounts, 1)
      assert.equal(attestedAccounts[0], caller)
    })

    it('should increment the number of completed verification requests', async () => {
      let [numCompleted, numTotal] = await attestations.getAttestationStats(phoneHash, caller)
      assert.equal(numCompleted.toNumber(), 0)

      await attestations.complete(phoneHash, v, r, s)
      ;[numCompleted, numTotal] = await attestations.getAttestationStats(phoneHash, caller)
      assert.equal(numCompleted.toNumber(), 1)
      assert.equal(numTotal.toNumber(), attestationsRequested)
    })

    it('should set the block number of the successful completion', async () => {
      await attestations.complete(phoneHash, v, r, s)

      const expectedBlock = await web3.eth.getBlock('latest')

      const [status, time] = await attestations.getAttestationState(phoneHash, caller, issuer)

      assert.equal(status.toNumber(), 2)
      assert.equal(time.toNumber(), expectedBlock.timestamp)
    })

    it('should increment pendingWithdrawals for the rewards recipient', async () => {
      await attestations.complete(phoneHash, v, r, s)
      const pendingWithdrawals = await attestations.pendingWithdrawals.call(
        mockStableToken.address,
        issuer
      )
      assert.equal(pendingWithdrawals.toString(), attestationFee.toString())
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
      ;[v, r, s] = await getVerificationCodeSignature(accounts[1], issuer)
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })

    it('should revert with a non-requested issuer', async () => {
      ;[v, r, s] = await getVerificationCodeSignature(caller, await getNonIssuer())
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })

    it('should revert an already completed request', async () => {
      await attestations.complete(phoneHash, v, r, s)
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })

    it('does not let you verify beyond the window', async () => {
      await timeTravel(attestationExpirySeconds, web3)
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })
  })

  describe('#withdraw()', () => {
    let issuer: string
    beforeEach(async () => {
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)
      issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
      const [v, r, s] = await getVerificationCodeSignature(caller, issuer)
      await attestations.complete(phoneHash, v, r, s)
    })

    it('should remove the balance of available rewards for the issuer', async () => {
      await attestations.withdraw(mockStableToken.address, {
        from: issuer,
      })
      const pendingWithdrawals: number = await attestations.pendingWithdrawals.call(
        mockStableToken.address,
        issuer
      )
      assert.equal(pendingWithdrawals, 0)
    })

    it('should emit the Withdrawal event', async () => {
      const response = await attestations.withdraw(mockStableToken.address, {
        from: issuer,
      })
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'Withdrawal',
        args: {
          account: issuer,
          token: mockStableToken.address,
          amount: attestationFee,
        },
      })
    })

    it('should not allow someone with no pending withdrawals to withdraw', async () => {
      await assertRevert(
        attestations.withdraw(mockStableToken.address, { from: await getNonIssuer() })
      )
    })
  })

  const requestAttestations = async () => {
    await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)
  }
  const requestAndCompleteAttestations = async () => {
    await requestAttestations()
    const issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
    const [v, r, s] = await getVerificationCodeSignature(caller, issuer)
    await attestations.complete(phoneHash, v, r, s)
  }

  describe('#lookupAccountsForIdentifier()', () => {
    describe('when an account has a claim', () => {
      beforeEach(async () => {
        await requestAttestations()
      })

      it("does not return the user's account", async () => {
        const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
        assert.isEmpty(attestedAccounts)
      })
    })

    describe('when an account has an attestation', () => {
      beforeEach(async () => {
        await requestAndCompleteAttestations()
      })

      describe('when the account has no walletAddress mapped', async () => {
        it('should allow a user to lookup the attested account of a phone number', async () => {
          const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
          assert.deepEqual(attestedAccounts, [caller])
        })
      })

      describe('when the account has a walletAddress mapped', async () => {
        beforeEach(setAccountWalletAddress)

        it('should allow a user to lookup the attested account of a phone number', async () => {
          const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
          assert.deepEqual(attestedAccounts, [caller])
        })
      })
    })

    describe('when an account is not attested', () => {
      it('should return an empty array for the phone number', async () => {
        const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
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
        ] = await attestations.batchGetAttestationStats.call([phoneHash])
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

      describe('when the account has a walletAddress mapped', async () => {
        beforeEach(setAccountWalletAddress)

        it('should allow a user to lookup the attested account of a phone number', async () => {
          const [matches, addresses, completed, total]: [
            BigNumber[],
            string[],
            BigNumber[],
            BigNumber[]
          ] = await attestations.batchGetAttestationStats.call([phoneHash])
          assert.lengthOf(matches, 1)
          assert.lengthOf(addresses, 1)
          assert.lengthOf(completed, 1)
          assert.lengthOf(total, 1)

          assert.equal(matches[0].toNumber(), 1)
          assert.equal(addresses[0], caller)
          assert.equal(completed[0].toNumber(), 1)
          assert.equal(total[0].toNumber(), 3)
        })

        describe('and another account also has an attestation to the same phone number', async () => {
          let other
          beforeEach(async () => {
            other = accounts[1]
            await attestations.request(phoneHash, attestationsRequested, mockStableToken.address, {
              from: other,
            })
            const issuer = (await attestations.getAttestationIssuers(phoneHash, other))[0]
            const [v, r, s] = await getVerificationCodeSignature(other, issuer)
            await attestations.complete(phoneHash, v, r, s, { from: other })
            await attestations.setWalletAddress(other, { from: other })
          })

          it('should return multiple attested accounts', async () => {
            await attestations.batchGetAttestationStats([phoneHash])

            const [matches, addresses, completed, total]: [
              BigNumber[],
              string[],
              BigNumber[],
              BigNumber[]
            ] = await attestations.batchGetAttestationStats.call([phoneHash])
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

      describe('when the account has no walletAddress mapped', async () => {
        it("returns the user's account with a zeroAddress", async () => {
          const [matches, addresses, completed, total]: [
            BigNumber[],
            string[],
            BigNumber[],
            BigNumber[]
          ] = await attestations.batchGetAttestationStats.call([phoneHash])
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
        ] = await attestations.batchGetAttestationStats.call([phoneHash])
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
      const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
      assert.isEmpty(attestedAccounts)
      const [matches, addresses, completed, total]: [
        BigNumber[],
        string[],
        BigNumber[],
        BigNumber[]
      ] = await attestations.batchGetAttestationStats.call([phoneHash])
      assert.lengthOf(matches, 1)
      assert.lengthOf(addresses, 0)
      assert.lengthOf(completed, 0)
      assert.lengthOf(total, 0)
    })
  })

  describe('#setMetadataURL', async () => {
    it('should set the metadataURL', async () => {
      await attestations.setMetadataURL(metadataURL)
      const result = await attestations.getMetadataURL(caller)
      assert.equal(result, metadataURL)
    })

    it('should emit the AccountMetadataURLSet event', async () => {
      const response = await attestations.setMetadataURL(metadataURL)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AccountMetadataURLSet',
        args: { account: caller, metadataURL },
      })
    })
  })
})

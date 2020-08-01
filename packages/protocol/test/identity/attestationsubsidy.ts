import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertRevert } from '@celo/protocol/lib/test-utils'
import { Address, privateKeyToAddress } from '@celo/utils/lib/address'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  MockElectionContract,
  MockElectionInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockRandomContract,
  MockRandomInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  MockValidatorsContract,
  RegistryContract,
  RegistryInstance,
  TestAttestationsContract,
  TestAttestationsInstance,
  AttestationSubsidyContract,
  MetaTransactionWalletContract,
  AttestationSubsidyInstance,
  MetaTransactionWalletInstance,
} from 'types'
import Web3 from 'web3'
import { getParsedSignatureOfAddress } from '../../lib/signing-utils'
// tslint:disable-next-line: ordered-imports
import Web3X = require('web3')
import {
  constructMetaTransactionExecutionDigest,
  getSignatureForDigest,
  MetaTransaction,
} from '../common/metatransactionwallet'

const Web3Class = (Web3X as any) as typeof Web3

const Accounts: AccountsContract = artifacts.require('Accounts')
/* We use a contract that behaves like the actual Attestations contract, but
 * mocks the implementations of validator set getters. These rely on precompiled
 * contracts, which are not available in our current ganache fork, which we use
 * for Truffle unit tests.
 */
const Attestations: TestAttestationsContract = artifacts.require('TestAttestations')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const Random: MockRandomContract = artifacts.require('MockRandom')
const Registry: RegistryContract = artifacts.require('Registry')
const AttestationSubsidy: AttestationSubsidyContract = artifacts.require('AttestationSubsidy')
const MetaTransactionWallet: MetaTransactionWalletContract = artifacts.require(
  'MetaTransactionWallet'
)

const getSignatureForMetaTx = async (
  walletAddress: Address,
  signer: Address,
  tx: MetaTransaction
) => {
  const digest = constructMetaTransactionExecutionDigest(walletAddress, tx)
  return getSignatureForDigest(digest, signer)
}

contract('AttestationSubsidy', (accounts: string[]) => {
  let attestationSubsidy: AttestationSubsidyInstance
  let accountsInstance: AccountsInstance
  let attestations: TestAttestationsInstance
  let mockStableToken: MockStableTokenInstance
  let otherMockStableToken: MockStableTokenInstance
  let random: MockRandomInstance
  let mockElection: MockElectionInstance
  let mockLockedGold: MockLockedGoldInstance
  let registry: RegistryInstance
  let callerMetaWallet: MetaTransactionWalletInstance

  const provider = new Web3Class.providers.HttpProvider('http://localhost:8545')
  const web3: Web3 = new Web3Class(provider)
  const phoneNumber: string = '+18005551212'
  const subsidyOwner: string = accounts[0]
  const caller: string = accounts[1]
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
  const attestationExpiryBlocks = (60 * 60) / 5
  const selectIssuersWaitBlocks = 4
  const maxAttestations = 20
  const attestationFee = new BigNumber(web3.utils.toWei('.05', 'ether').toString())

  // async function getVerificationCodeSignature(
  //     account: string,
  //     issuer: string
  // ): Promise<[number, string, string]> {
  //     const privateKey = getDerivedKey(KeyOffsets.ATTESTING_KEY_OFFSET, issuer)
  //     const {v, r, s} = AttestationUtils.attestToIdentifier(phoneHash, account, privateKey)
  //     return [v, r, s]
  // }

  // async function setAccountWalletAddress() {
  //     return accountsInstance.setWalletAddress(caller, '0x0', '0x0', '0x0')
  // }

  // const getNonIssuer = async () => {
  //     const issuers = await attestations.getAttestationIssuers(phoneHash, caller)
  //     let nonIssuerIndex = 0
  //     while (issuers.indexOf(accounts[nonIssuerIndex]) !== -1) {
  //         nonIssuerIndex++
  //     }
  //     return accounts[nonIssuerIndex]
  // }

  enum KeyOffsets {
    VALIDATING_KEY_OFFSET,
    ATTESTING_KEY_OFFSET,
    NEW_VALIDATING_KEY_OFFSET,
  }

  const getDerivedKey = (offset: number, address: string) => {
    const pKey = accountPrivateKeys[accounts.indexOf(address)]
    const aKey = Buffer.from(pKey.slice(2), 'hex')
    aKey.write((aKey[0] + offset).toString(16))
    return '0x' + aKey.toString('hex')
  }

  const unlockAndAuthorizeKey = async (offset: number, authorizeFn: any, account: string) => {
    const key = getDerivedKey(offset, account)
    const addr = privateKeyToAddress(key)
    // @ts-ignore
    await web3.eth.personal.importRawKey(key, 'passphrase')
    await web3.eth.personal.unlockAccount(addr, 'passphrase', 1000000)

    const signature = await getParsedSignatureOfAddress(web3, account, addr)
    return authorizeFn(addr, signature.v, signature.r, signature.s, {
      from: account,
    })
  }

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    mockStableToken = await MockStableToken.new()
    otherMockStableToken = await MockStableToken.new()
    const mockValidators = await MockValidators.new()
    attestations = await Attestations.new()
    attestationSubsidy = await AttestationSubsidy.new()
    random = await Random.new()
    await random.initialize(256)
    await random.addTestRandomness(0, '0x00')
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)

    await Promise.all(
      accounts.map(async (account) => {
        await accountsInstance.createAccount({ from: account })
        await unlockAndAuthorizeKey(
          KeyOffsets.VALIDATING_KEY_OFFSET,
          accountsInstance.authorizeValidatorSigner,
          account
        )
        await unlockAndAuthorizeKey(
          KeyOffsets.ATTESTING_KEY_OFFSET,
          accountsInstance.authorizeAttestationSigner,
          account
        )
      })
    )

    mockElection = await MockElection.new()
    await mockElection.setElectedValidators(
      accounts.map((account) =>
        privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account))
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
      [mockStableToken.address, otherMockStableToken.address],
      [attestationFee, attestationFee]
    )

    await attestationSubsidy.initialize(registry.address, {
      from: subsidyOwner,
    })

    await attestations.__setValidators(
      accounts.map((account) =>
        privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account))
      )
    )

    callerMetaWallet = await MetaTransactionWallet.new()
    await callerMetaWallet.initialize(caller)
  })

  describe('#initialize()', () => {
    it('should not be callable again', async () => {
      await assertRevert(
        attestations.initialize(
          registry.address,
          attestationExpiryBlocks,
          selectIssuersWaitBlocks,
          maxAttestations,
          [mockStableToken.address],
          [attestationFee]
        )
      )
    })
  })

  describe('#requestAttestationsWithSubsidy', () => {
    it('should work when the wallet has zero balance', async () => {
      const approveSignature = await getSignatureForMetaTx(callerMetaWallet.address, caller, {
        value: 0,
        destination: mockStableToken.address,
        data: web3.eth.abi.encodeFunctionCall(
          {
            name: 'approve',
            type: 'function',
            inputs: [
              {
                type: 'address',
                name: 'spender',
              },
              {
                type: 'uint256',
                name: 'amount',
              },
            ],
          },
          [attestations.address, attestationFee.multipliedBy(attestationsRequested).toString(10)]
        ),
        nonce: 0,
      })

      const requestAttestationSignature = await getSignatureForMetaTx(
        callerMetaWallet.address,
        caller,
        {
          value: 0,
          destination: attestations.address,
          data: web3.eth.abi.encodeFunctionCall(
            {
              name: 'request',
              type: 'function',
              inputs: [
                {
                  type: 'bytes32',
                  name: 'identifier',
                },
                {
                  type: 'uint256',
                  name: 'attestationsRequested',
                },
                {
                  type: 'address',
                  name: 'attestationRequestFeeToken',
                },
              ],
            },
            [phoneHash, attestationsRequested.toString(), mockStableToken.address]
          ),
          nonce: 1,
        }
      )

      await attestationSubsidy.requestAttestationsWithSubsidy(
        callerMetaWallet.address,
        phoneHash,
        attestationsRequested,
        [approveSignature.v, requestAttestationSignature.v],
        [approveSignature.r, requestAttestationSignature.r],
        [approveSignature.s, requestAttestationSignature.s],
        {
          from: subsidyOwner,
        }
      )
      const [completed, total] = await attestations.getAttestationStats(
        phoneHash,
        callerMetaWallet.address
      )
      assertEqualBN(completed, 0)
      assertEqualBN(total, attestationsRequested)
    })
  })
})

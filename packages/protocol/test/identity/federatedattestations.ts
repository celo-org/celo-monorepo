import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import {
  getDomainDigest,
  getSignatureForAttestation,
} from '@celo/protocol/lib/fed-attestations-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertEqualBNArray,
  assertGteBN,
  assertLogMatches2,
  assertRevert,
  assertRevertWithReason,
  assertThrowsAsync,
  assumeOwnership,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  FederatedAttestationsContract,
  FederatedAttestationsInstance,
  RegistryInstance,
} from 'types'
import { encodePacked, keccak256 } from 'web3-utils'

const Accounts: AccountsContract = artifacts.require('Accounts')
const FederatedAttestations: FederatedAttestationsContract =
  artifacts.require('FederatedAttestations')

contract('FederatedAttestations', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let federatedAttestations: FederatedAttestationsInstance
  let registry: RegistryInstance
  let initialize

  const chainId = 1

  const owner = accounts[0]
  const issuer1 = accounts[1]
  const signer1 = accounts[2]
  const account1 = accounts[3]

  const phoneNumber: string = '+18005551212'
  const identifier1 = getPhoneHash(phoneNumber)
  const identifier2 = getPhoneHash(phoneNumber, 'dummySalt')

  const nowUnixTime = Math.floor(Date.now() / 1000)
  // Set lower bound to (now - 1 hour) in seconds
  const publishedOnLowerBound = nowUnixTime - 60 * 60

  const signerRole = keccak256(encodePacked('celo.org/core/attestation'))
  let sig

  const signAndRegisterAttestation = async (
    identifier: string,
    issuer: string, // Must be a registered account
    account: string,
    issuedOn: number,
    signer: string
  ) => {
    const attestationSignature = await getSignatureForAttestation(
      identifier,
      issuer,
      account,
      issuedOn,
      signer,
      chainId,
      federatedAttestations.address
    )
    if (issuer !== signer && !(await accountsInstance.isSigner(issuer, signer, signerRole))) {
      await accountsInstance.authorizeSigner(signer, signerRole, {
        from: issuer,
      })
      await accountsInstance.completeSignerAuthorization(issuer, signerRole, {
        from: signer,
      })
    }
    await federatedAttestations.registerAttestation(
      identifier,
      issuer,
      account,
      signer,
      issuedOn,
      attestationSignature.v,
      attestationSignature.r,
      attestationSignature.s,
      {
        from: issuer,
      }
    )
  }

  const assertAttestationInStorage = async (
    identifier: string,
    issuer: string,
    attestationIndex: number,
    account: string,
    issuedOn: number,
    signer: string,
    identifierIndex: number
  ) => {
    const attestation = await federatedAttestations.identifierToAttestations(
      identifier,
      issuer,
      attestationIndex
    )
    assert.equal(attestation['account'], account)
    assert.equal(attestation['issuedOn'], issuedOn)
    assert.equal(attestation['signer'], signer)
    // Intentionally not checking publishedOn since this value is set on-chain
    const storedIdentifier = await federatedAttestations.addressToIdentifiers(
      account,
      issuer,
      identifierIndex
    )
    assert.equal(identifier, storedIdentifier)
  }

  const assertAttestationNotInStorage = async (
    identifier: string,
    issuer: string,
    account: string,
    addressIndex: number,
    identifierIndex: number
  ) => {
    await assertThrowsAsync(
      federatedAttestations.identifierToAttestations(identifier, issuer, addressIndex)
    )
    await assertThrowsAsync(
      federatedAttestations.addressToIdentifiers(account, issuer, identifierIndex)
    )
  }

  interface AttestationTestCase {
    account: string
    issuedOn: number
    signer: string
  }

  const checkAgainstExpectedAttestations = (
    expectedCountsPerIssuer: number[],
    expectedAttestations: AttestationTestCase[],
    expectedPublishedOnLowerBound: number,
    actualCountsPerIssuer: BigNumber[],
    actualAddresses: string[],
    actualSigners: string[],
    actualIssuedOns: BigNumber[],
    actualPublishedOns: BigNumber[]
  ) => {
    assertEqualBNArray(actualCountsPerIssuer, expectedCountsPerIssuer)
    assert.lengthOf(actualAddresses, expectedAttestations.length)
    assert.lengthOf(actualSigners, expectedAttestations.length)
    assert.lengthOf(actualIssuedOns, expectedAttestations.length)
    assert.lengthOf(actualPublishedOns, expectedAttestations.length)

    expectedAttestations.forEach((expectedAttestation, index) => {
      assert.equal(actualAddresses[index], expectedAttestation.account)
      assert.equal(actualSigners[index], expectedAttestation.signer)
      assertEqualBN(actualIssuedOns[index], expectedAttestation.issuedOn)
      // Check min bounds for publishedOn
      assertGteBN(actualPublishedOns[index], expectedPublishedOnLowerBound)
    })
  }

  before(async () => {
    registry = await getDeployedProxiedContract('Registry', artifacts)
    if ((await registry.owner()) !== owner) {
      // In CI we need to assume ownership, locally using quicktest we don't
      await assumeOwnership(['Registry'], owner)
    }
  })

  beforeEach('FederatedAttestations setup', async () => {
    accountsInstance = await Accounts.new(true)
    federatedAttestations = await FederatedAttestations.new(true)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(
      CeloContractName.FederatedAttestations,
      federatedAttestations.address
    )
    await accountsInstance.initialize(registry.address)
    initialize = await federatedAttestations.initialize()

    await accountsInstance.createAccount({ from: issuer1 })
    sig = await getSignatureForAttestation(
      identifier1,
      issuer1,
      account1,
      nowUnixTime,
      signer1,
      chainId,
      federatedAttestations.address
    )
  })

  describe('#EIP712_OWNERSHIP_ATTESTATION_TYPEHASH()', () => {
    it('should have set the right typehash', async () => {
      const expectedTypehash = keccak256(
        'OwnershipAttestation(bytes32 identifier,address issuer,address account,address signer,uint64 issuedOn)'
      )
      assert.equal(
        await federatedAttestations.EIP712_OWNERSHIP_ATTESTATION_TYPEHASH(),
        expectedTypehash
      )
    })
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const actualOwner: string = await federatedAttestations.owner()
      assert.equal(actualOwner, owner)
    })

    it('should have set the EIP-712 domain separator', async () => {
      assert.equal(
        await federatedAttestations.eip712DomainSeparator(),
        getDomainDigest(federatedAttestations.address)
      )
    })

    it('should emit the EIP712DomainSeparatorSet event', () => {
      assertLogMatches2(initialize.logs[1], {
        event: 'EIP712DomainSeparatorSet',
        args: {
          eip712DomainSeparator: getDomainDigest(federatedAttestations.address),
        },
      })
    })

    it('should not be callable again', async () => {
      await assertRevert(federatedAttestations.initialize())
    })
  })

  describe('#lookupAttestations', () => {
    describe('when identifier has not been registered', () => {
      it('should return empty list', async () => {
        const [countsPerIssuer, addresses, signers, issuedOns, publishedOns] =
          await federatedAttestations.lookupAttestations(identifier1, [issuer1])
        checkAgainstExpectedAttestations(
          [0],
          [],
          0,
          countsPerIssuer,
          addresses,
          signers,
          issuedOns,
          publishedOns
        )
      })
    })
    describe('when identifier has been registered', () => {
      const account2 = accounts[4]

      const issuer2 = accounts[5]
      const issuer2Signer = accounts[6]
      const issuer2Signer2 = accounts[7]
      const issuer3 = accounts[8]

      const issuer1Attestations: AttestationTestCase[] = [
        {
          account: account1,
          signer: signer1,
          issuedOn: nowUnixTime,
        },
        // Same issuer as [0], different account
        {
          account: account2,
          signer: signer1,
          issuedOn: nowUnixTime,
        },
      ]
      const issuer2Attestations: AttestationTestCase[] = [
        // Same account as issuer1Attestations[0], different issuer
        {
          account: account1,
          signer: issuer2Signer,
          issuedOn: nowUnixTime,
        },
        // Different account and signer
        {
          account: account2,
          signer: issuer2Signer2,
          issuedOn: nowUnixTime,
        },
      ]

      beforeEach(async () => {
        // Require consistent order for test cases
        await accountsInstance.createAccount({ from: issuer2 })
        for (const { issuer, attestationsPerIssuer } of [
          { issuer: issuer1, attestationsPerIssuer: issuer1Attestations },
          { issuer: issuer2, attestationsPerIssuer: issuer2Attestations },
        ]) {
          for (const attestation of attestationsPerIssuer) {
            await signAndRegisterAttestation(
              identifier1,
              issuer,
              attestation.account,
              attestation.issuedOn,
              attestation.signer
            )
          }
        }
      })

      it('should return empty count and list if no issuers specified', async () => {
        const [countsPerIssuer, addresses, signers, issuedOns, publishedOns] =
          await federatedAttestations.lookupAttestations(identifier1, [])
        checkAgainstExpectedAttestations(
          [],
          [],
          0,
          countsPerIssuer,
          addresses,
          signers,
          issuedOns,
          publishedOns
        )
      })

      it('should return all attestations from one issuer', async () => {
        const [countsPerIssuer, addresses, signers, issuedOns, publishedOns] =
          await federatedAttestations.lookupAttestations(identifier1, [issuer1])
        checkAgainstExpectedAttestations(
          [issuer1Attestations.length],
          issuer1Attestations,
          publishedOnLowerBound,
          countsPerIssuer,
          addresses,
          signers,
          issuedOns,
          publishedOns
        )
      })

      it('should return empty list if no attestations exist for an issuer', async () => {
        const [countsPerIssuer, addresses, signers, issuedOns, publishedOns] =
          await federatedAttestations.lookupAttestations(identifier1, [issuer3])
        checkAgainstExpectedAttestations(
          [0],
          [],
          0,
          countsPerIssuer,
          addresses,
          signers,
          issuedOns,
          publishedOns
        )
      })

      it('should return attestations from multiple issuers in correct order', async () => {
        const expectedAttestations = issuer2Attestations.concat(issuer1Attestations)
        const expectedCountsPerIssuer = [0, issuer2Attestations.length, issuer1Attestations.length]
        const [countsPerIssuer, addresses, signers, issuedOns, publishedOns] =
          await federatedAttestations.lookupAttestations(identifier1, [issuer3, issuer2, issuer1])
        checkAgainstExpectedAttestations(
          expectedCountsPerIssuer,
          expectedAttestations,
          publishedOnLowerBound,
          countsPerIssuer,
          addresses,
          signers,
          issuedOns,
          publishedOns
        )
      })
    })
    describe('when identifier has been registered and then revoked', () => {
      beforeEach(async () => {
        await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, signer1)
        await federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
          from: issuer1,
        })
      })
      it('should return empty list', async () => {
        const [countsPerIssuer, addresses, signers, issuedOns, publishedOns] =
          await federatedAttestations.lookupAttestations(identifier1, [issuer1])
        checkAgainstExpectedAttestations(
          [0],
          [],
          0,
          countsPerIssuer,
          addresses,
          signers,
          issuedOns,
          publishedOns
        )
      })
    })
  })

  describe('#lookupIdentifiers', () => {
    interface IdentifierTestCase {
      identifier: string
      signer: string
    }

    const checkAgainstExpectedIdCases = (
      expectedCountsPerIssuer: number[],
      expectedIdentifiers: IdentifierTestCase[],
      actualCountsPerIssuer: BigNumber[],
      actualIdentifiers: string[]
    ) => {
      assertEqualBNArray(actualCountsPerIssuer, expectedCountsPerIssuer)
      assert.deepEqual(
        actualIdentifiers,
        expectedIdentifiers.map((idCase) => idCase.identifier)
      )
    }

    describe('when address has not been registered', () => {
      it('should return empty list', async () => {
        const [actualCountsPerIssuer, actualIdentifiers] =
          await federatedAttestations.lookupIdentifiers(account1, [issuer1])
        checkAgainstExpectedIdCases([0], [], actualCountsPerIssuer, actualIdentifiers)
      })
    })

    describe('when address has been registered', () => {
      const issuer2 = accounts[4]
      const issuer2Signer = accounts[5]
      const issuer2Signer2 = accounts[6]
      const issuer3 = accounts[7]

      const issuer1IdCases: IdentifierTestCase[] = [
        {
          identifier: identifier1,
          signer: signer1,
        },
        {
          identifier: identifier2,
          signer: signer1,
        },
      ]
      const issuer2IdCases: IdentifierTestCase[] = [
        {
          identifier: identifier1,
          signer: issuer2Signer2,
        },
        {
          identifier: identifier2,
          signer: issuer2Signer,
        },
      ]

      beforeEach(async () => {
        await accountsInstance.createAccount({ from: issuer2 })
        // Require consistent order for test cases
        for (const { issuer, idCasesPerIssuer } of [
          { issuer: issuer1, idCasesPerIssuer: issuer1IdCases },
          { issuer: issuer2, idCasesPerIssuer: issuer2IdCases },
        ]) {
          for (const idCase of idCasesPerIssuer) {
            await signAndRegisterAttestation(
              idCase.identifier,
              issuer,
              account1,
              nowUnixTime,
              idCase.signer
            )
          }
        }
      })

      it('should return empty count if no issuers specified', async () => {
        const [actualCountsPerIssuer, actualIdentifiers] =
          await federatedAttestations.lookupIdentifiers(account1, [])
        checkAgainstExpectedIdCases([], [], actualCountsPerIssuer, actualIdentifiers)
      })

      it('should return all identifiers from one issuer', async () => {
        const [actualCountsPerIssuer, actualIdentifiers] =
          await federatedAttestations.lookupIdentifiers(account1, [issuer1])
        checkAgainstExpectedIdCases(
          [issuer1IdCases.length],
          issuer1IdCases,
          actualCountsPerIssuer,
          actualIdentifiers
        )
      })

      it('should return empty list if no identifiers exist for an (issuer,address)', async () => {
        const [actualCountsPerIssuer, actualIdentifiers] =
          await federatedAttestations.lookupIdentifiers(account1, [issuer3])
        checkAgainstExpectedIdCases([0], [], actualCountsPerIssuer, actualIdentifiers)
      })

      it('should return identifiers from multiple issuers in correct order', async () => {
        const expectedIdCases = issuer2IdCases.concat(issuer1IdCases)
        const expectedCountsPerIssuer = [0, issuer2IdCases.length, issuer1IdCases.length]
        const [actualCountsPerIssuer, actualIdentifiers] =
          await federatedAttestations.lookupIdentifiers(account1, [issuer3, issuer2, issuer1])
        checkAgainstExpectedIdCases(
          expectedCountsPerIssuer,
          expectedIdCases,
          actualCountsPerIssuer,
          actualIdentifiers
        )
      })
    })
    describe('when identifier has been registered and then revoked', () => {
      beforeEach(async () => {
        await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, signer1)
        await federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
          from: issuer1,
        })
      })
      it('should return empty list', async () => {
        const [actualCountsPerIssuer, actualIdentifiers] =
          await federatedAttestations.lookupIdentifiers(account1, [issuer1])
        checkAgainstExpectedIdCases([0], [], actualCountsPerIssuer, actualIdentifiers)
      })
    })
  })

  describe('#validateAttestation', async () => {
    describe('with an authorized AttestationSigner', async () => {
      beforeEach(async () => {
        await accountsInstance.authorizeSigner(signer1, signerRole, { from: issuer1 })
        await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer1 })
      })

      it('should return successfully if a valid signature is used', async () => {
        assert.isOk(
          await federatedAttestations.validateAttestationSig(
            identifier1,
            issuer1,
            account1,
            signer1,
            nowUnixTime,
            sig.v,
            sig.r,
            sig.s
          )
        )
      })

      it('should return false if an invalid signature is provided', async () => {
        const sig2 = await getSignatureForAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          accounts[4],
          chainId,
          federatedAttestations.address
        )
        await assertRevert(
          federatedAttestations.validateAttestationSig(
            identifier1,
            issuer1,
            account1,
            signer1,
            nowUnixTime,
            sig2.v,
            sig2.r,
            sig2.s
          )
        )
      })

      const wrongArgs = [
        [0, 'identifier', identifier2],
        [1, 'issuer', accounts[4]],
        [2, 'account', accounts[4]],
        [3, 'signer', accounts[4]],
        [4, 'issuedOn', nowUnixTime - 1],
      ]
      wrongArgs.forEach(([index, arg, wrongValue]) => {
        it(`should fail if the provided ${arg} is different from the attestation`, async () => {
          const args = [identifier1, issuer1, account1, signer1, nowUnixTime, sig.v, sig.r, sig.s]
          args[index] = wrongValue
          await assertRevert(federatedAttestations.validateAttestationSig.apply(this, args))
        })
      })
    })

    it('should revert if the signer is not authorized as an AttestationSigner by the issuer', async () => {
      await assertRevert(
        federatedAttestations.validateAttestationSig(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })

    it('should revert if the signer is authorized as a different role by the issuer', async () => {
      const role = keccak256('random')
      await accountsInstance.authorizeSigner(signer1, role, { from: issuer1 })
      await accountsInstance.completeSignerAuthorization(issuer1, role, { from: signer1 })

      await assertRevert(
        federatedAttestations.validateAttestationSig(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })
  })

  describe('#registerAttestation', () => {
    beforeEach(async () => {
      await accountsInstance.authorizeSigner(signer1, signerRole, { from: issuer1 })
      await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer1 })
    })

    it('should emit AttestationRegistered for a valid attestation', async () => {
      const register = await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        signer1,
        nowUnixTime,
        sig.v,
        sig.r,
        sig.s
      )

      // fetching onchain publishedOn value as expected test value to avoid testing for a specific value
      // as it would be a very flaky test
      const attestation = await federatedAttestations.identifierToAttestations(
        identifier1,
        issuer1,
        0
      )
      const publishedOn = attestation['publishedOn']
      assertLogMatches2(register.logs[0], {
        event: 'AttestationRegistered',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
          signer: signer1,
          issuedOn: nowUnixTime,
          publishedOn,
        },
      })
      assertGteBN(publishedOn, publishedOnLowerBound)
    })

    it('should succeed if issuer == signer', async () => {
      await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, issuer1)
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, issuer1, 0)
    })

    it('should revert if an invalid signature is provided', async () => {
      const sig2 = await getSignatureForAttestation(
        identifier1,
        issuer1,
        account1,
        nowUnixTime,
        accounts[4],
        chainId,
        federatedAttestations.address
      )
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig2.v,
          sig2.r,
          sig2.s
        )
      )
    })

    it('should revert if signer has been deregistered', async () => {
      await accountsInstance.removeSigner(signer1, signerRole, { from: issuer1 })
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })

    it('should revert if attestation has been revoked', async () => {
      await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, signer1)
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
        from: issuer1,
      })
      await assertRevertWithReason(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s,
          { from: issuer1 }
        ),
        'Attestation has been revoked'
      )
    })

    it('should modify identifierToAttestations and addresstoIdentifiers accordingly', async () => {
      await assertAttestationNotInStorage(identifier1, issuer1, account1, 0, 0)
      await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, signer1)
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
    })

    describe('when registering a second attestation', () => {
      beforeEach(async () => {
        // register first attestation
        await federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s,
          { from: issuer1 }
        )
      })

      it('should modify identifierToAttestations and addresstoIdentifiers accordingly', async () => {
        const account2 = accounts[4]
        await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
        await assertAttestationNotInStorage(identifier1, issuer1, account2, 1, 0)

        await signAndRegisterAttestation(identifier1, issuer1, account2, nowUnixTime, signer1)
        await assertAttestationInStorage(identifier1, issuer1, 1, account2, nowUnixTime, signer1, 0)
      })

      it('should revert if an attestation with the same (issuer, identifier, account) is uploaded again', async () => {
        // Upload the same attestation signed by a different signer, authorized under the same issuer
        const signer2 = accounts[5]
        await accountsInstance.authorizeSigner(signer2, signerRole, { from: issuer1 })
        await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer2 })
        const sig2 = await getSignatureForAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime + 1,
          signer2,
          1,
          federatedAttestations.address
        )
        await assertRevert(
          federatedAttestations.registerAttestation(
            identifier1,
            issuer1,
            account1,
            signer2,
            nowUnixTime,
            sig2.v,
            sig2.r,
            sig2.s,
            { from: issuer1 }
          )
        )
      })

      it('should succeed with a different identifier', async () => {
        await signAndRegisterAttestation(identifier2, issuer1, account1, nowUnixTime, signer1)
        await assertAttestationInStorage(identifier2, issuer1, 0, account1, nowUnixTime, signer1, 1)
      })

      it('should succeed with a different issuer', async () => {
        const issuer2 = accounts[5]
        const signer2 = accounts[6]
        await accountsInstance.createAccount({ from: issuer2 })
        await signAndRegisterAttestation(identifier1, issuer2, account1, nowUnixTime, signer2)
        await assertAttestationInStorage(identifier1, issuer2, 0, account1, nowUnixTime, signer2, 0)
      })

      it('should succeed with a different account', async () => {
        const account2 = accounts[5]
        await signAndRegisterAttestation(identifier1, issuer1, account2, nowUnixTime, signer1)
        await assertAttestationInStorage(identifier1, issuer1, 1, account2, nowUnixTime, signer1, 0)
      })
    })

    it('should succeed if any user attempts to register the attestation with a valid signature', async () => {
      assert.isOk(
        await federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s,
          { from: accounts[5] }
        )
      )
    })

    it('should succeed if a different AttestationSigner authorized by the same issuer registers the attestation', async () => {
      const signer2 = accounts[5]
      await accountsInstance.authorizeSigner(signer2, signerRole, { from: issuer1 })
      await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer2 })
      await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        signer1,
        nowUnixTime,
        sig.v,
        sig.r,
        sig.s,
        { from: signer2 }
      )
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
    })

    it('should succeed if the issuer submits the attestation directly', async () => {
      await federatedAttestations.registerAttestationAsIssuer(identifier1, account1, nowUnixTime, {
        from: issuer1,
      })
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, issuer1, 0)
    })

    it('should succeed if issuer is not registered in Accounts.sol', async () => {
      const issuer2 = accounts[5]
      assert.isFalse(await accountsInstance.isAccount(issuer2))
      await federatedAttestations.registerAttestationAsIssuer(identifier1, account1, nowUnixTime, {
        from: issuer2,
      })
      await assertAttestationInStorage(identifier1, issuer2, 0, account1, nowUnixTime, issuer2, 0)
    })

    it('should revert if MAX_ATTESTATIONS_PER_IDENTIFIER have already been registered', async () => {
      for (
        let i = 0;
        // This should not overflow and if it does, the test should fail anyways
        i < (await federatedAttestations.MAX_ATTESTATIONS_PER_IDENTIFIER()).toNumber();
        i++
      ) {
        // accounts[n] is limited
        const newAccount = await web3.eth.accounts.create().address
        await federatedAttestations.registerAttestationAsIssuer(
          identifier1,
          newAccount,
          nowUnixTime,
          { from: issuer1 }
        )
      }
      await assertRevertWithReason(
        federatedAttestations.registerAttestationAsIssuer(identifier1, account1, nowUnixTime, {
          from: issuer1,
        }),
        'Max attestations already registered for identifier'
      )
    })
    it('should revert if MAX_IDENTIFIERS_PER_ADDRESS have already been registered', async () => {
      for (
        let i = 0;
        // This should not overflow and if it does, the test should fail anyways
        i < (await federatedAttestations.MAX_IDENTIFIERS_PER_ADDRESS()).toNumber();
        i++
      ) {
        const newIdentifier = getPhoneHash(phoneNumber, `dummysalt-${i}`)
        await federatedAttestations.registerAttestationAsIssuer(
          newIdentifier,
          account1,
          nowUnixTime,
          { from: issuer1 }
        )
      }
      await assertRevertWithReason(
        federatedAttestations.registerAttestationAsIssuer(identifier1, account1, nowUnixTime, {
          from: issuer1,
        }),
        'Max identifiers already registered for account'
      )
    })
  })

  describe('#revokeAttestation', () => {
    beforeEach(async () => {
      await accountsInstance.authorizeSigner(signer1, signerRole, { from: issuer1 })
      await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer1 })
      await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        signer1,
        nowUnixTime,
        sig.v,
        sig.r,
        sig.s,
        { from: issuer1 }
      )
    })

    it('should modify identifierToAttestations and addresstoIdentifiers accordingly', async () => {
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
        from: issuer1,
      })
      await assertAttestationNotInStorage(identifier1, issuer1, account1, 0, 0)
    })

    it('should succeed when revoked by a current signer of issuer', async () => {
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
        from: signer1,
      })
      await assertAttestationNotInStorage(identifier1, issuer1, account1, 0, 0)
    })

    it('should revert when signer has been deregistered', async () => {
      await accountsInstance.removeSigner(signer1, signerRole, { from: issuer1 })
      await assertRevert(
        federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
          from: signer1,
        })
      )
    })

    it('should emit an AttestationRevoked event after successfully revoking', async () => {
      const attestation = await federatedAttestations.identifierToAttestations(
        identifier1,
        issuer1,
        0
      )

      // fetching onchain publishedOn value as expected test value to avoid testing for a specific value
      // as it would be a very flaky test to try and predict the value
      const publishedOn = attestation['publishedOn']
      const revokeAttestation = await federatedAttestations.revokeAttestation(
        identifier1,
        issuer1,
        account1,
        { from: issuer1 }
      )
      assertLogMatches2(revokeAttestation.logs[0], {
        event: 'AttestationRevoked',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
          signer: signer1,
          issuedOn: nowUnixTime,
          publishedOn,
        },
      })
    })

    it('should succeed if issuer is not registered in Accounts.sol', async () => {
      const issuer2 = accounts[4]
      assert.isFalse(await accountsInstance.isAccount(issuer2))
      await federatedAttestations.registerAttestationAsIssuer(identifier1, account1, nowUnixTime, {
        from: issuer2,
      })
      await assertAttestationInStorage(identifier1, issuer2, 0, account1, nowUnixTime, issuer2, 0)
      await federatedAttestations.revokeAttestation(identifier1, issuer2, account1, {
        from: issuer2,
      })
      await assertAttestationNotInStorage(identifier1, issuer2, account1, 0, 0)
    })

    it("should revert when revoking an attestation that doesn't exist", async () => {
      await assertRevertWithReason(
        federatedAttestations.revokeAttestation(identifier1, issuer1, accounts[5], {
          from: issuer1,
        }),
        'Attestation to be revoked does not exist'
      )
    })

    it('should succeed when >1 attestations are registered for (identifier, issuer)', async () => {
      const account2 = accounts[4]
      await signAndRegisterAttestation(identifier1, issuer1, account2, nowUnixTime, signer1)
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account2, {
        from: account2,
      })
      await assertAttestationNotInStorage(identifier1, issuer1, account2, 1, 0)
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
    })

    it('should succeed when >1 identifiers are registered for (account, issuer)', async () => {
      await signAndRegisterAttestation(identifier2, issuer1, account1, nowUnixTime, signer1)
      await federatedAttestations.revokeAttestation(identifier2, issuer1, account1, {
        from: account1,
      })
      await assertAttestationNotInStorage(identifier2, issuer1, account1, 0, 1)
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
    })

    const newAttestation = [
      [0, 'identifier', identifier2],
      // skipping issuer as it requires a different signer as well
      [2, 'account', accounts[4]],
      [3, 'issuedOn', nowUnixTime + 1],
      [4, 'signer', accounts[4]],
    ]
    newAttestation.forEach(([index, arg, newVal]) => {
      it(`after revoking an attestation, should succeed in registering new attestation with different ${arg}`, async () => {
        await federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
          from: issuer1,
        })
        const args = [identifier1, issuer1, account1, nowUnixTime, signer1]
        args[index] = newVal
        await signAndRegisterAttestation.apply(this, args)
      })
    })

    it('should revert if an invalid user attempts to revoke the attestation', async () => {
      await assertRevert(
        federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
          from: accounts[5],
        })
      )
    })

    it('should fail to register a revoked attestation', async () => {
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
        from: issuer1,
      })
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s,
          { from: issuer1 }
        )
      )
    })
  })

  describe('#batchRevokeAttestations', () => {
    const account2 = accounts[4]
    const signer2 = accounts[5]

    beforeEach(async () => {
      await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, signer1)
      await signAndRegisterAttestation(identifier1, issuer1, account2, nowUnixTime, signer2)
      await signAndRegisterAttestation(identifier2, issuer1, account2, nowUnixTime, signer1)
    })
    it('should succeed if issuer batch revokes attestations', async () => {
      await federatedAttestations.batchRevokeAttestations(
        issuer1,
        [identifier1, identifier2],
        [account1, account2],
        { from: issuer1 }
      )
      const [countsPerIssuer1, addresses1, signers1, issuedOns1, publishedOns1] =
        await federatedAttestations.lookupAttestations(identifier1, [issuer1])
      checkAgainstExpectedAttestations(
        [1],
        [{ account: account2, issuedOn: nowUnixTime, signer: signer2 }],
        publishedOnLowerBound,
        countsPerIssuer1,
        addresses1,
        signers1,
        issuedOns1,
        publishedOns1
      )
      const [countsPerIssuer2, addresses2, signers2, issuedOns2, publishedOns2] =
        await federatedAttestations.lookupAttestations(identifier2, [issuer1])
      checkAgainstExpectedAttestations(
        [0],
        [],
        publishedOnLowerBound,
        countsPerIssuer2,
        addresses2,
        signers2,
        issuedOns2,
        publishedOns2
      )
    })

    it('should succeed regardless of order of (attestations, identifiers)', async () => {
      await federatedAttestations.batchRevokeAttestations(
        issuer1,
        [identifier2, identifier1],
        [account2, account1],
        { from: issuer1 }
      )
      const [countsPerIssuer1, addresses1, signers1, issuedOns1, publishedOns1] =
        await federatedAttestations.lookupAttestations(identifier1, [issuer1])
      checkAgainstExpectedAttestations(
        [1],
        [{ account: account2, issuedOn: nowUnixTime, signer: signer2 }],
        publishedOnLowerBound,
        countsPerIssuer1,
        addresses1,
        signers1,
        issuedOns1,
        publishedOns1
      )
      const [countsPerIssuer2, addresses2, signers2, issuedOns2, publishedOns2] =
        await federatedAttestations.lookupAttestations(identifier2, [issuer1])
      checkAgainstExpectedAttestations(
        [0],
        [],
        publishedOnLowerBound,
        countsPerIssuer2,
        addresses2,
        signers2,
        issuedOns2,
        publishedOns2
      )
    })

    it('should succeed if currently registered signer of issuer batch revokes attestations', async () => {
      await federatedAttestations.batchRevokeAttestations(
        issuer1,
        [identifier2, identifier1],
        [account2, account1],
        { from: signer1 }
      )
      const [countsPerIssuer1, addresses1, signers1, issuedOns1, publishedOns1] =
        await federatedAttestations.lookupAttestations(identifier1, [issuer1])
      checkAgainstExpectedAttestations(
        [1],
        [{ account: account2, issuedOn: nowUnixTime, signer: signer2 }],
        publishedOnLowerBound,
        countsPerIssuer1,
        addresses1,
        signers1,
        issuedOns1,
        publishedOns1
      )
      const [countsPerIssuer2, addresses2, signers2, issuedOns2, publishedOns2] =
        await federatedAttestations.lookupAttestations(identifier2, [issuer1])
      checkAgainstExpectedAttestations(
        [0],
        [],
        publishedOnLowerBound,
        countsPerIssuer2,
        addresses2,
        signers2,
        issuedOns2,
        publishedOns2
      )
    })

    it('should succeed if issuer is not registered in Accounts.sol', async () => {
      const issuer2 = accounts[6]
      assert.isFalse(await accountsInstance.isAccount(issuer2))
      await federatedAttestations.registerAttestationAsIssuer(identifier1, account1, nowUnixTime, {
        from: issuer2,
      })
      await assertAttestationInStorage(identifier1, issuer2, 0, account1, nowUnixTime, issuer2, 0)
      await federatedAttestations.batchRevokeAttestations(issuer2, [identifier1], [account1], {
        from: issuer2,
      })
      await assertAttestationNotInStorage(identifier1, issuer2, account1, 0, 0)
    })

    it('should revert if deregistered signer of issuer batch revokes attestations', async () => {
      await accountsInstance.removeSigner(signer1, signerRole, { from: issuer1 })
      await assertRevert(
        federatedAttestations.batchRevokeAttestations(
          issuer1,
          [identifier2, identifier1],
          [account2, account1],
          { from: signer1 }
        )
      )
    })
    it('should revert if identifiers.length != accounts.length', async () => {
      await assertRevert(
        federatedAttestations.batchRevokeAttestations(
          issuer1,
          [identifier2],
          [account2, account1],
          { from: signer1 }
        )
      )
    })
    it('should revert if one of the (identifier, account) pairs is invalid', async () => {
      await assertRevertWithReason(
        federatedAttestations.batchRevokeAttestations(
          issuer1,
          // (identifier2, account1) does not exist
          [identifier2, identifier2],
          [account2, account1],
          { from: signer1 }
        ),
        'Attestation to be revoked does not exist'
      )
    })
  })
})

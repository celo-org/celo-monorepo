import {
  getDomainDigest,

  getSignatureForAttestation
} from '@celo/protocol/lib/fed-attestations-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import {
  AccountsContract,
  AccountsInstance,
  FederatedAttestationsContract,
  FederatedAttestationsInstance,
  RegistryContract,
  RegistryInstance
} from 'types'
import { keccak256 } from 'web3-utils'

const Accounts: AccountsContract = artifacts.require('Accounts')
const FederatedAttestations: FederatedAttestationsContract = artifacts.require(
  'FederatedAttestations'
)
const Registry: RegistryContract = artifacts.require('Registry')

contract('FederatedAttestations', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let federatedAttestations: FederatedAttestationsInstance
  let registry: RegistryInstance
  let initialize

  const caller: string = accounts[0]
  const phoneNumber: string = '+18005551212'
  const pnIdentifier: string = getPhoneHash(phoneNumber)

  const getCurrentUnixTime = () => Math.floor(Date.now() / 1000)
  const chainId = 1

  beforeEach('FederatedAttestations setup', async () => {
    accountsInstance = await Accounts.new(true)
    federatedAttestations = await FederatedAttestations.new(true)
    registry = await Registry.new(true)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(
      CeloContractName.FederatedAttestations,
      federatedAttestations.address
    )

    initialize = await federatedAttestations.initialize(registry.address)
  })

  describe('#EIP712_VALIDATE_ATTESTATION_TYPEHASH()', () => {
    it('should have set the right typehash', async () => {
      const expectedTypehash = keccak256(
        'IdentifierOwnershipAttestation(bytes32 identifier,address issuer,address account,uint256 issuedOn)'
      )
      assert.equal(
        await federatedAttestations.EIP712_VALIDATE_ATTESTATION_TYPEHASH(),
        expectedTypehash
      )
    })
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await federatedAttestations.owner()
      assert.equal(owner, caller)
    })

    it('should have set the registry address', async () => {
      const registryAddress: string = await federatedAttestations.registry()
      assert.equal(registryAddress, registry.address)
    })

    it('should have set the EIP-712 domain separator', async () => {
      assert.equal(
        await federatedAttestations.eip712DomainSeparator(),
        getDomainDigest(federatedAttestations.address)
      )
    })

    it('should emit the EIP712DomainSeparatorSet event', () => {
      assertLogMatches2(initialize.logs[2], {
        event: 'EIP712DomainSeparatorSet',
        args: {
          eip712DomainSeparator: getDomainDigest(federatedAttestations.address),
        },
      })
    })

    it('should not be callable again', async () => {
      await assertRevert(federatedAttestations.initialize(registry.address))
    })
  })

  describe('#lookupAttestations', () => {
    it('should', async () => {})
  })

  describe('#lookupIdentifiersByAddress', () => {
    it('should', async () => {})
  })

  describe('#isValidAttestation', async () => {
    const issuer = accounts[0]
    const signer = accounts[1]
    const account = accounts[2]
    const issuedOn = getCurrentUnixTime()
    let sig

    beforeEach(async () => {
      sig = await getSignatureForAttestation(
        pnIdentifier,
        issuer,
        account,
        issuedOn,
        signer,
        chainId,
        federatedAttestations.address
      )
      await accountsInstance.createAccount({ from: issuer })
    })

    describe('with an authorized AttestationSigner', async () => {
      beforeEach(async () => {
        const role = keccak256('celo.org/core/attestation')
        await accountsInstance.authorizeSigner(signer, role, { from: issuer })
        await accountsInstance.completeSignerAuthorization(issuer, role, { from: signer })
      })

      it('should return true if a valid signature is used', async () => {
        assert.isTrue(
          await federatedAttestations.isValidAttestation(
            pnIdentifier,
            issuer,
            account,
            issuedOn,
            signer,
            sig.v,
            sig.r,
            sig.s
          )
        )
      })

      it('should return false if an invalid signature is provided', async () => {
        const sig2 = (sig = await getSignatureForAttestation(
          pnIdentifier,
          issuer,
          account,
          issuedOn,
          accounts[3],
          chainId,
          federatedAttestations.address
        ))
        assert.isFalse(
          await federatedAttestations.isValidAttestation(
            pnIdentifier,
            issuer,
            account,
            issuedOn,
            signer,
            sig2.v,
            sig2.r,
            sig2.s
          )
        )
      })

      const wrongArgs = [
        [0, 'identifier', getPhoneHash('+14169483397')],
        [1, 'issuer', accounts[3]],
        [2, 'account', accounts[3]],
        [3, 'issuedOn', issuedOn - 1],
        [4, 'signer', accounts[3]],
      ]
      wrongArgs.forEach(([index, arg, wrongValue]) => {
        it(`should fail if the provided ${arg} is different from the attestation`, async () => {
          let args = [pnIdentifier, issuer, account, issuedOn, signer, sig.v, sig.r, sig.s]
          args[index] = wrongValue

          if (arg == 'issuer' || arg == 'signer') {
            await assertRevert(
              federatedAttestations.isValidAttestation.apply(this, args),
              'Signer has not been authorized as an AttestationSigner by the issuer'
            )
          } else {
            assert.isFalse(await federatedAttestations.isValidAttestation.apply(this, args))
          }
        })
      })

      it('should revert if the signer is revoked', async () => {
        await federatedAttestations.revokeSigner(signer)
        await assertRevert(
          federatedAttestations.isValidAttestation(
            pnIdentifier,
            issuer,
            account,
            issuedOn,
            signer,
            sig.v,
            sig.r,
            sig.s
          ),
          'Signer has been revoked'
        )
      })
    })

    it('should revert if the signer is not authorized as an AttestationSigner by the issuer', async () => {
      await assertRevert(
        federatedAttestations.isValidAttestation(
          pnIdentifier,
          issuer,
          account,
          issuedOn,
          signer,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })

    it('should revert if the signer is authorized as a different role by the issuer', async () => {
      const role = keccak256('random')
      await accountsInstance.authorizeSigner(signer, role, { from: issuer })
      await accountsInstance.completeSignerAuthorization(issuer, role, { from: signer })

      await assertRevert(
        federatedAttestations.isValidAttestation(
          pnIdentifier,
          issuer,
          account,
          issuedOn,
          signer,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })

    it('should revert if the signer is authorized as a different role by the issuer', async () => {
      const role = keccak256('random')
      await accountsInstance.authorizeSigner(signer, role, { from: issuer })
      await accountsInstance.completeSignerAuthorization(issuer, role, { from: signer })

      await assertRevert(
        federatedAttestations.isValidAttestation(
          pnIdentifier,
          issuer,
          account,
          issuedOn,
          signer,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })
  })

  describe('#registerAttestation', () => {
    it('should', async () => {})
  })

  describe('#deleteAttestation', () => {
    it('should', async () => {})
  })
})

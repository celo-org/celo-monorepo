import { getSignatureForAttestation } from '@celo/protocol/lib/fed-attestations-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import {
  AccountsContract,
  AccountsInstance,
  FederatedAttestationsContract,
  FederatedAttestationsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const FederatedAttestations: FederatedAttestationsContract = artifacts.require(
  'FederatedAttestations'
)
const Registry: RegistryContract = artifacts.require('Registry')

contract('FederatedAttestations', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let federatedAttestations: FederatedAttestationsInstance
  let registry: RegistryInstance

  const caller: string = accounts[0]
  const phoneNumber: string = '+18005551212'
  const pnIdentifier: string = getPhoneHash(phoneNumber)

  const getCurrentUnixTime = () => Math.floor(Date.now() / 1000)

  beforeEach('FederatedAttestations setup', async () => {
    accountsInstance = await Accounts.new(true)
    federatedAttestations = await FederatedAttestations.new(true)
    registry = await Registry.new(true)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(
      CeloContractName.FederatedAttestations,
      federatedAttestations.address
    )
    await accountsInstance.initialize(registry.address)
    await federatedAttestations.initialize(registry.address)
    await federatedAttestations.setEip712DomainSeparator()
  })

  describe('#initialize()', () => {
    it('TODO ASv2', async () => {
      // TODO ASv2
      assert(caller)
      assert(federatedAttestations)
    })
  })

  describe('#lookupAttestations', () => {
    it('should', async () => {})
  })

  describe('#lookupIdentifiersByAddress', () => {
    it('should', async () => {})
  })

  describe('#validateAttestation', () => {
    const issuer = accounts[0]
    const signer = accounts[1]
    const account = accounts[2]
    const issuedOn = getCurrentUnixTime()

    it('should', async () => {
      const sig = await getSignatureForAttestation(
        pnIdentifier,
        issuer,
        account,
        issuedOn,
        signer,
        1,
        federatedAttestations.address
      )
      assert.isTrue(
        await federatedAttestations.validateAttestation(
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

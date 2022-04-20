import { CeloContractName } from '@celo/protocol/lib/registry-utils'
// import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
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
  // const phoneNumber: string = '+18005551212'
  // const phoneHash: string = getPhoneHash(phoneNumber)

  beforeEach('FederatedAttestations setup', async () => {
    accountsInstance = await Accounts.new(true)
    federatedAttestations = await FederatedAttestations.new(true)
    registry = await Registry.new(true)
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await federatedAttestations.initialize(registry.address)
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
    it('should', async () => {})
  })

  describe('#registerAttestation', () => {
    it('should', async () => {})
  })

  describe('#deleteAttestation', () => {
    it('should', async () => {})
  })
})

import { Address } from '@celo/base/lib/address'
import { concurrentMap } from '@celo/base/lib/async'
import { mapFromPairs } from '@celo/base/lib/collections'
import { ABIDefinition } from 'web3-eth-abi'
import { AbiType } from 'web3-utils'
import { CeloContract, RegisteredContracts } from '../base'
import { PROXY_ABI } from '../governance/proxy'
import { ContractKit } from '../kit'

interface ContractDetails {
  name: string
  address: Address
  jsonInterface: ABIDefinition[]
}

interface ContractMapping {
  details: ContractDetails
  abiMapping: Map<string, ABIDefinition>
}

const getContractDetailsFromContract = async (
  kit: ContractKit,
  celoContract: CeloContract,
  address?: string
) => {
  const contract = await kit._web3Contracts.getContract(celoContract, address)
  return {
    name: celoContract,
    address: address ?? contract.options.address,
    jsonInterface: contract.options.jsonInterface as any, // TODO fix types
  }
}

const getContractMappingFromDetails = (
  cd: ContractDetails,
  abiFilterType: AbiType
): ContractMapping => ({
  details: cd,
  abiMapping: mapFromPairs(
    cd.jsonInterface
      .concat(PROXY_ABI)
      .filter((ad) => ad.type === abiFilterType)
      .map((ad) => [ad.signature, ad])
  ),
})

const obtainKitContractDetails = (kit: ContractKit): Promise<ContractDetails[]> =>
  concurrentMap(5, RegisteredContracts, (celoContract) =>
    getContractDetailsFromContract(kit, celoContract)
  )

const getAddressMappingFromDetails = (contractDetails: ContractDetails[], abiType: AbiType) =>
  mapFromPairs(
    contractDetails.map((cd) => [cd.address, getContractMappingFromDetails(cd, abiType)])
  )

export class BaseExplorer {
  constructor(
    protected readonly kit: ContractKit,
    private readonly abiType: AbiType,
    protected addressMapping: Map<Address, ContractMapping> = new Map()
  ) {}

  init = async () => {
    const contractDetails = await obtainKitContractDetails(this.kit)
    this.addressMapping = getAddressMappingFromDetails(contractDetails, this.abiType)
  }

  updateContractDetailsMapping = async (name: string, address: string) => {
    const cd = await getContractDetailsFromContract(this.kit, name as CeloContract, address)
    this.addressMapping.set(cd.address, getContractMappingFromDetails(cd, this.abiType))
  }
}

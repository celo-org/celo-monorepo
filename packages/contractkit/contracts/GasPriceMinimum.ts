import Web3 from 'web3'
import { GasPriceMinimum as GasPriceMinimumType } from '../types/GasPriceMinimum'
export default async function getInstance(web3: Web3, account: string | null = null) {
  const contract = (new web3.eth.Contract(
    [
      {
        constant: true,
        inputs: [],
        name: 'initialized',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'gasPriceMinimum',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'targetDensity',
        outputs: [
          {
            name: 'numerator',
            type: 'uint256',
          },
          {
            name: 'denominator',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'registry',
        outputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'owner',
        outputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'isOwner',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'adjustmentSpeed',
        outputs: [
          {
            name: 'numerator',
            type: 'uint256',
          },
          {
            name: 'denominator',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'registryAddress',
            type: 'address',
          },
        ],
        name: 'setRegistry',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'infrastructureFraction',
        outputs: [
          {
            name: 'numerator',
            type: 'uint256',
          },
          {
            name: 'denominator',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'transferOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'numerator',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'denominator',
            type: 'uint256',
          },
        ],
        name: 'TargetDensitySet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'numerator',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'denominator',
            type: 'uint256',
          },
        ],
        name: 'AdjustmentSpeedSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'numerator',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'denominator',
            type: 'uint256',
          },
        ],
        name: 'InfrastructureFractionSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'registryAddress',
            type: 'address',
          },
        ],
        name: 'RegistrySet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
      {
        constant: false,
        inputs: [
          {
            name: '_registryAddress',
            type: 'address',
          },
          {
            name: 'initialGas',
            type: 'uint256',
          },
          {
            name: 'targetDensityNumerator',
            type: 'uint256',
          },
          {
            name: 'targetDensityDenominator',
            type: 'uint256',
          },
          {
            name: 'adjustmentSpeedNumerator',
            type: 'uint256',
          },
          {
            name: 'adjustmentSpeedDenominator',
            type: 'uint256',
          },
          {
            name: 'infrastructureFractionNumerator',
            type: 'uint256',
          },
          {
            name: 'infrastructureFractionDenominator',
            type: 'uint256',
          },
        ],
        name: 'initialize',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'numerator',
            type: 'uint256',
          },
          {
            name: 'denominator',
            type: 'uint256',
          },
        ],
        name: 'setAdjustmentSpeed',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'numerator',
            type: 'uint256',
          },
          {
            name: 'denominator',
            type: 'uint256',
          },
        ],
        name: 'setTargetDensity',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'numerator',
            type: 'uint256',
          },
          {
            name: 'denominator',
            type: 'uint256',
          },
        ],
        name: 'setInfrastructureFraction',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'tokenAddress',
            type: 'address',
          },
        ],
        name: 'getGasPriceMinimum',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'blockGasTotal',
            type: 'uint256',
          },
          {
            name: 'blockGasLimit',
            type: 'uint256',
          },
        ],
        name: 'updateGasPriceMinimum',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'blockGasTotal',
            type: 'uint256',
          },
          {
            name: 'blockGasLimit',
            type: 'uint256',
          },
        ],
        name: 'getUpdatedGasPriceMinimum',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
    '0x74e8289Ca8CFE6c0226819ceF37cf59EA1c4575C'
  ) as unknown) as GasPriceMinimumType
  contract.options.from = account || (await web3.eth.getAccounts())[0]
  return contract
}

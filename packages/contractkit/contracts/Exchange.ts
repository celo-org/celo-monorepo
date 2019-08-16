import Web3 from 'web3'
import { Exchange as ExchangeType } from '../types/Exchange'
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
        name: 'minimumReports',
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
        name: 'stable',
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
        name: 'stableBucket',
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
        name: 'spread',
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
        constant: true,
        inputs: [],
        name: 'goldBucket',
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
        name: 'updateFrequency',
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
        name: 'reserveFraction',
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
        constant: true,
        inputs: [],
        name: 'lastBucketUpdate',
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
        payable: true,
        stateMutability: 'payable',
        type: 'fallback',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'exchanger',
            type: 'address',
          },
          {
            indexed: false,
            name: 'sellAmount',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'buyAmount',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'soldGold',
            type: 'bool',
          },
        ],
        name: 'Exchanged',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'updateFrequency',
            type: 'uint256',
          },
        ],
        name: 'UpdateFrequencySet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'minimumReports',
            type: 'uint256',
          },
        ],
        name: 'MinimumReportsSet',
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
            name: 'registryAddress',
            type: 'address',
          },
          {
            name: 'stableToken',
            type: 'address',
          },
          {
            name: 'spreadNumerator',
            type: 'uint256',
          },
          {
            name: 'spreadDenominator',
            type: 'uint256',
          },
          {
            name: 'reserveFractionNumerator',
            type: 'uint256',
          },
          {
            name: 'reserveFractionDenominator',
            type: 'uint256',
          },
          {
            name: '_updateFrequency',
            type: 'uint256',
          },
          {
            name: '_minimumReports',
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
            name: 'sellAmount',
            type: 'uint256',
          },
          {
            name: 'minBuyAmount',
            type: 'uint256',
          },
          {
            name: 'sellGold',
            type: 'bool',
          },
        ],
        name: 'exchange',
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
            name: 'sellAmount',
            type: 'uint256',
          },
          {
            name: 'sellGold',
            type: 'bool',
          },
        ],
        name: 'getBuyTokenAmount',
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
        inputs: [
          {
            name: 'buyAmount',
            type: 'uint256',
          },
          {
            name: 'sellGold',
            type: 'bool',
          },
        ],
        name: 'getSellTokenAmount',
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
        inputs: [
          {
            name: 'sellGold',
            type: 'bool',
          },
        ],
        name: 'getBuyAndSellBuckets',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
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
            name: 'newUpdateFrequency',
            type: 'uint256',
          },
        ],
        name: 'setUpdateFrequency',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'newMininumReports',
            type: 'uint256',
          },
        ],
        name: 'setMinimumReports',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    '0x68f7DC469d34d1A071aF0Fc9BB228f04D97Ba893'
  ) as unknown) as ExchangeType
  contract.options.from = account || (await web3.eth.getAccounts())[0]
  return contract
}

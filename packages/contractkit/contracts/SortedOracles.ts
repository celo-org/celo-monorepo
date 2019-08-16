import Web3 from 'web3'
import { SortedOracles as SortedOraclesType } from '../types/SortedOracles'
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
        inputs: [
          {
            name: '',
            type: 'address',
          },
          {
            name: '',
            type: 'address',
          },
        ],
        name: 'isOracle',
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
        name: 'reportExpirySeconds',
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
        inputs: [
          {
            name: '',
            type: 'address',
          },
          {
            name: '',
            type: 'uint256',
          },
        ],
        name: 'oracles',
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
        inputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        name: 'rates',
        outputs: [
          {
            name: 'head',
            type: 'address',
          },
          {
            name: 'tail',
            type: 'address',
          },
          {
            name: 'medianKey',
            type: 'address',
          },
          {
            name: 'numElements',
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
            name: '',
            type: 'address',
          },
        ],
        name: 'timestamps',
        outputs: [
          {
            name: 'head',
            type: 'address',
          },
          {
            name: 'tail',
            type: 'address',
          },
          {
            name: 'medianKey',
            type: 'address',
          },
          {
            name: 'numElements',
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
            indexed: true,
            name: 'token',
            type: 'address',
          },
          {
            indexed: true,
            name: 'oracleAddress',
            type: 'address',
          },
        ],
        name: 'OracleAdded',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'token',
            type: 'address',
          },
          {
            indexed: true,
            name: 'oracleAddress',
            type: 'address',
          },
        ],
        name: 'OracleRemoved',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'token',
            type: 'address',
          },
          {
            indexed: false,
            name: 'oracle',
            type: 'address',
          },
          {
            indexed: false,
            name: 'timestamp',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'numerator',
            type: 'uint128',
          },
          {
            indexed: false,
            name: 'denominator',
            type: 'uint128',
          },
        ],
        name: 'OracleReported',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'token',
            type: 'address',
          },
          {
            indexed: true,
            name: 'oracle',
            type: 'address',
          },
        ],
        name: 'OracleReportRemoved',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'token',
            type: 'address',
          },
          {
            indexed: false,
            name: 'numerator',
            type: 'uint128',
          },
          {
            indexed: false,
            name: 'denominator',
            type: 'uint128',
          },
        ],
        name: 'MedianUpdated',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'reportExpiry',
            type: 'uint256',
          },
        ],
        name: 'ReportExpirySet',
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
            name: '_reportExpirySeconds',
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
            name: '_reportExpirySeconds',
            type: 'uint256',
          },
        ],
        name: 'setReportExpiry',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'token',
            type: 'address',
          },
          {
            name: 'oracleAddress',
            type: 'address',
          },
        ],
        name: 'addOracle',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'token',
            type: 'address',
          },
          {
            name: 'oracleAddress',
            type: 'address',
          },
          {
            name: 'index',
            type: 'uint256',
          },
        ],
        name: 'removeOracle',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'token',
            type: 'address',
          },
          {
            name: 'n',
            type: 'uint256',
          },
        ],
        name: 'removeExpiredReports',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'token',
            type: 'address',
          },
          {
            name: 'numerator',
            type: 'uint128',
          },
          {
            name: 'denominator',
            type: 'uint128',
          },
          {
            name: 'lesserKey',
            type: 'address',
          },
          {
            name: 'greaterKey',
            type: 'address',
          },
        ],
        name: 'report',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'token',
            type: 'address',
          },
        ],
        name: 'numRates',
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
            name: 'token',
            type: 'address',
          },
        ],
        name: 'medianRate',
        outputs: [
          {
            name: '',
            type: 'uint128',
          },
          {
            name: '',
            type: 'uint128',
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
            name: 'token',
            type: 'address',
          },
        ],
        name: 'getRates',
        outputs: [
          {
            name: '',
            type: 'address[]',
          },
          {
            name: '',
            type: 'uint256[]',
          },
          {
            name: '',
            type: 'uint256[]',
          },
          {
            name: '',
            type: 'uint8[]',
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
            name: 'token',
            type: 'address',
          },
        ],
        name: 'numTimestamps',
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
            name: 'token',
            type: 'address',
          },
        ],
        name: 'medianTimestamp',
        outputs: [
          {
            name: '',
            type: 'uint128',
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
            name: 'token',
            type: 'address',
          },
        ],
        name: 'getTimestamps',
        outputs: [
          {
            name: '',
            type: 'address[]',
          },
          {
            name: '',
            type: 'uint256[]',
          },
          {
            name: '',
            type: 'uint256[]',
          },
          {
            name: '',
            type: 'uint8[]',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
    '0x3a9Da1d341F3E7AC24243EA65517F0FE5325D2Ae'
  ) as unknown) as SortedOraclesType
  contract.options.from = account || (await web3.eth.getAccounts())[0]
  return contract
}

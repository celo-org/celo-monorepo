import Web3 from 'web3'
import { Random as RandomType } from '../types/Random'
export default async function getInstance(web3: Web3, account: string | null = null) {
  const contract = (new web3.eth.Contract(
    [
      {
        constant: true,
        inputs: [],
        name: '_random',
        outputs: [
          {
            name: '',
            type: 'bytes32',
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
        name: 'commitments',
        outputs: [
          {
            name: '',
            type: 'bytes32',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [],
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
            name: 'randomness',
            type: 'bytes32',
          },
          {
            name: 'newCommitment',
            type: 'bytes32',
          },
          {
            name: 'proposer',
            type: 'address',
          },
        ],
        name: 'revealAndCommit',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'randomness',
            type: 'bytes32',
          },
        ],
        name: 'computeCommitment',
        outputs: [
          {
            name: '',
            type: 'bytes32',
          },
        ],
        payable: false,
        stateMutability: 'pure',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'random',
        outputs: [
          {
            name: '',
            type: 'bytes32',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
    '0x66211CCF609489Ed2540f04036450c77F2792175'
  ) as unknown) as RandomType
  contract.options.from = account || (await web3.eth.getAccounts())[0]
  return contract
}

import Web3 from 'web3'
import { Validators as ValidatorsType } from '../types/Validators'
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
        name: 'minElectableValidators',
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
        constant: true,
        inputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        name: 'voters',
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
        name: 'maxElectableValidators',
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
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'minElectableValidators',
            type: 'uint256',
          },
        ],
        name: 'MinElectableValidatorsSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'maxElectableValidators',
            type: 'uint256',
          },
        ],
        name: 'MaxElectableValidatorsSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'value',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'noticePeriod',
            type: 'uint256',
          },
        ],
        name: 'RegistrationRequirementSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'validator',
            type: 'address',
          },
          {
            indexed: false,
            name: 'identifier',
            type: 'string',
          },
          {
            indexed: false,
            name: 'name',
            type: 'string',
          },
          {
            indexed: false,
            name: 'url',
            type: 'string',
          },
          {
            indexed: false,
            name: 'publicKey',
            type: 'bytes',
          },
        ],
        name: 'ValidatorRegistered',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'validator',
            type: 'address',
          },
        ],
        name: 'ValidatorDeregistered',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'validator',
            type: 'address',
          },
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
        ],
        name: 'ValidatorAffiliated',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'validator',
            type: 'address',
          },
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
        ],
        name: 'ValidatorDeaffiliated',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
          {
            indexed: false,
            name: 'identifier',
            type: 'string',
          },
          {
            indexed: false,
            name: 'name',
            type: 'string',
          },
          {
            indexed: false,
            name: 'url',
            type: 'string',
          },
        ],
        name: 'ValidatorGroupRegistered',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
        ],
        name: 'ValidatorGroupDeregistered',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
          {
            indexed: true,
            name: 'validator',
            type: 'address',
          },
        ],
        name: 'ValidatorGroupMemberAdded',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
          {
            indexed: true,
            name: 'validator',
            type: 'address',
          },
        ],
        name: 'ValidatorGroupMemberRemoved',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
          {
            indexed: true,
            name: 'validator',
            type: 'address',
          },
        ],
        name: 'ValidatorGroupMemberReordered',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
        ],
        name: 'ValidatorGroupEmptied',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'account',
            type: 'address',
          },
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
          {
            indexed: false,
            name: 'weight',
            type: 'uint256',
          },
        ],
        name: 'ValidatorGroupVoteCast',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'account',
            type: 'address',
          },
          {
            indexed: true,
            name: 'group',
            type: 'address',
          },
          {
            indexed: false,
            name: 'weight',
            type: 'uint256',
          },
        ],
        name: 'ValidatorGroupVoteRevoked',
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
            name: '_minElectableValidators',
            type: 'uint256',
          },
          {
            name: '_maxElectableValidators',
            type: 'uint256',
          },
          {
            name: 'requirementValue',
            type: 'uint256',
          },
          {
            name: 'requirementNoticePeriod',
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
            name: '_minElectableValidators',
            type: 'uint256',
          },
        ],
        name: 'setMinElectableValidators',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: '_maxElectableValidators',
            type: 'uint256',
          },
        ],
        name: 'setMaxElectableValidators',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'value',
            type: 'uint256',
          },
          {
            name: 'noticePeriod',
            type: 'uint256',
          },
        ],
        name: 'setRegistrationRequirement',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'identifier',
            type: 'string',
          },
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'url',
            type: 'string',
          },
          {
            name: 'publicKey',
            type: 'bytes',
          },
          {
            name: 'noticePeriod',
            type: 'uint256',
          },
        ],
        name: 'registerValidator',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'index',
            type: 'uint256',
          },
        ],
        name: 'deregisterValidator',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'group',
            type: 'address',
          },
        ],
        name: 'affiliate',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [],
        name: 'deaffiliate',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'identifier',
            type: 'string',
          },
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'url',
            type: 'string',
          },
          {
            name: 'noticePeriod',
            type: 'uint256',
          },
        ],
        name: 'registerValidatorGroup',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'index',
            type: 'uint256',
          },
        ],
        name: 'deregisterValidatorGroup',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'validator',
            type: 'address',
          },
        ],
        name: 'addMember',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'validator',
            type: 'address',
          },
        ],
        name: 'removeMember',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'validator',
            type: 'address',
          },
          {
            name: 'lesserMember',
            type: 'address',
          },
          {
            name: 'greaterMember',
            type: 'address',
          },
        ],
        name: 'reorderMember',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'group',
            type: 'address',
          },
          {
            name: 'lesser',
            type: 'address',
          },
          {
            name: 'greater',
            type: 'address',
          },
        ],
        name: 'vote',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'lesser',
            type: 'address',
          },
          {
            name: 'greater',
            type: 'address',
          },
        ],
        name: 'revokeVote',
        outputs: [
          {
            name: '',
            type: 'bool',
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
            name: 'account',
            type: 'address',
          },
        ],
        name: 'getValidator',
        outputs: [
          {
            name: '',
            type: 'string',
          },
          {
            name: '',
            type: 'string',
          },
          {
            name: '',
            type: 'string',
          },
          {
            name: '',
            type: 'bytes',
          },
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
            name: 'account',
            type: 'address',
          },
        ],
        name: 'getValidatorGroup',
        outputs: [
          {
            name: '',
            type: 'string',
          },
          {
            name: '',
            type: 'string',
          },
          {
            name: '',
            type: 'string',
          },
          {
            name: '',
            type: 'address[]',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getValidatorGroupVotes',
        outputs: [
          {
            name: '',
            type: 'address[]',
          },
          {
            name: '',
            type: 'uint256[]',
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
            name: 'group',
            type: 'address',
          },
        ],
        name: 'getVotesReceived',
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
        name: 'getRegistrationRequirement',
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
        constant: true,
        inputs: [],
        name: 'getRegisteredValidators',
        outputs: [
          {
            name: '',
            type: 'address[]',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getRegisteredValidatorGroups',
        outputs: [
          {
            name: '',
            type: 'address[]',
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
            name: 'account',
            type: 'address',
          },
        ],
        name: 'isValidating',
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
            name: 'account',
            type: 'address',
          },
        ],
        name: 'isVoting',
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
        name: 'getValidators',
        outputs: [
          {
            name: '',
            type: 'address[]',
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
            name: 'account',
            type: 'address',
          },
        ],
        name: 'isValidatorGroup',
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
            name: 'account',
            type: 'address',
          },
        ],
        name: 'isValidator',
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
            name: 'account',
            type: 'address',
          },
          {
            name: 'noticePeriod',
            type: 'uint256',
          },
        ],
        name: 'meetsRegistrationRequirements',
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
    ],
    '0x9E2210e98Db72e5DC30872fB021772C33e04c035'
  ) as unknown) as ValidatorsType
  contract.options.from = account || (await web3.eth.getAccounts())[0]
  return contract
}

import Web3 from 'web3'

export default async function getInstance(web3: Web3) {
  return new web3.eth.Contract(
    [
  {
    "constant": true,
    "inputs": [],
    "name": "initialized",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "registry",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "isOwner",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "registryAddress",
        "type": "address"
      }
    ],
    "name": "setRegistry",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "attestationRequestFees",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "pendingWithdrawals",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "attestationExpirySeconds",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "attestationsRequested",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "attestationRequestFeeToken",
        "type": "address"
      }
    ],
    "name": "AttestationsRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "issuer",
        "type": "address"
      }
    ],
    "name": "AttestationCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawal",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "AttestationExpirySecondsSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "AttestationRequestFeeSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "dataEncryptionKey",
        "type": "bytes"
      }
    ],
    "name": "AccountDataEncryptionKeySet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "metadataURL",
        "type": "string"
      }
    ],
    "name": "AccountMetadataURLSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "walletAddress",
        "type": "address"
      }
    ],
    "name": "AccountWalletAddressSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "registryAddress",
        "type": "address"
      }
    ],
    "name": "RegistrySet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "registryAddress",
        "type": "address"
      },
      {
        "name": "_attestationExpirySeconds",
        "type": "uint256"
      },
      {
        "name": "attestationRequestFeeTokens",
        "type": "address[]"
      },
      {
        "name": "attestationRequestFeeValues",
        "type": "uint256[]"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "name": "attestationsRequested",
        "type": "uint256"
      },
      {
        "name": "attestationRequestFeeToken",
        "type": "address"
      }
    ],
    "name": "request",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "name": "encryptedPhone",
        "type": "bytes"
      },
      {
        "name": "issuer",
        "type": "address"
      },
      {
        "name": "sendSms",
        "type": "bool"
      }
    ],
    "name": "reveal",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "name": "v",
        "type": "uint8"
      },
      {
        "name": "r",
        "type": "bytes32"
      },
      {
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "complete",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "revoke",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "token",
        "type": "address"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "dataEncryptionKey",
        "type": "bytes"
      },
      {
        "name": "walletAddress",
        "type": "address"
      }
    ],
    "name": "setAccount",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getAttestationIssuers",
    "outputs": [
      {
        "name": "",
        "type": "address[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getAttestationStats",
    "outputs": [
      {
        "name": "",
        "type": "uint64"
      },
      {
        "name": "",
        "type": "uint64"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "identifiersToLookup",
        "type": "bytes32[]"
      }
    ],
    "name": "batchGetAttestationStats",
    "outputs": [
      {
        "name": "",
        "type": "uint256[]"
      },
      {
        "name": "",
        "type": "address[]"
      },
      {
        "name": "",
        "type": "uint64[]"
      },
      {
        "name": "",
        "type": "uint64[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "name": "account",
        "type": "address"
      },
      {
        "name": "issuer",
        "type": "address"
      }
    ],
    "name": "getAttestationState",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      },
      {
        "name": "",
        "type": "uint128"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getAttestationRequestFeeToken",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getMostRecentAttestationRequest",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "token",
        "type": "address"
      }
    ],
    "name": "getAttestationRequestFee",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "token",
        "type": "address"
      },
      {
        "name": "fee",
        "type": "uint256"
      }
    ],
    "name": "setAttestationRequestFee",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_attestationExpirySeconds",
        "type": "uint256"
      }
    ],
    "name": "setAttestationExpirySeconds",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "metadataURL",
        "type": "string"
      }
    ],
    "name": "setMetadataURL",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getMetadataURL",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "dataEncryptionKey",
        "type": "bytes"
      }
    ],
    "name": "setAccountDataEncryptionKey",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getDataEncryptionKey",
    "outputs": [
      {
        "name": "",
        "type": "bytes"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "walletAddress",
        "type": "address"
      }
    ],
    "name": "setWalletAddress",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getWalletAddress",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "identifier",
        "type": "bytes32"
      },
      {
        "name": "account",
        "type": "address"
      },
      {
        "name": "v",
        "type": "uint8"
      },
      {
        "name": "r",
        "type": "bytes32"
      },
      {
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "validateAttestationCode",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "identifier",
        "type": "bytes32"
      }
    ],
    "name": "lookupAccountsForIdentifier",
    "outputs": [
      {
        "name": "",
        "type": "address[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getValidators",
    "outputs": [
      {
        "name": "",
        "type": "address[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
],
   "0x31d9efd78ea09A3eEd23E93327Fb815821FA8802"
  )
}
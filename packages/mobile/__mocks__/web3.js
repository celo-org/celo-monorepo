const GAS_PER_TRANSACTION = 21001.0
const GAS_PRICE_PLACEHOLDER = 18000000000

export class Contract {}

export const providers = {
  HttpProvider: class {},
  IpcProvider: class {
    constructor() {
      this.connection = {
        _events: {
          data: () => {},
        },
      }
    }
  },
}

const latestBlock = {
  number: 200,
  parentHash: '0x000000000000000000000001',
  hash: '0x000000000000000000000001',
  miner: '0x000000000000000000000001',
}

const otherBlock = {
  number: 150,
  parentHash: '0x000000000000000000000002',
  hash: '0x000000000000000000000002',
  miner: '0x000000000000000000000002',
}

export default class {
  static providers = providers

  eth = {
    Contract,
    getTransactionCount: () => {},
    getGasPrice: async () => GAS_PRICE_PLACEHOLDER,
    estimateGas: async () => GAS_PER_TRANSACTION,
    getBlock: async (number) => {
      return number === 'latest' ? latestBlock : otherBlock
    },
    getAccounts: () => {},
    accounts: {
      privateKeyToAccount: () => ({ address: '0x0000000000000000000000000000000000007E57' }),
      wallet: {
        add: () => null,
      },
      create: () => ({
        address: '0x0000000000000000000000000000000000007E57',
        privateKey: '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724',
      }),
    },
    personal: {
      importRawKey: () => '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724',
      unlockAccount: async () => true,
    },
    sendTransaction: async () => {},
    isSyncing: jest.fn(() => ({ startingBlock: 0, currentBlock: 10, highestBlock: 100 })),
    sign: jest.fn(() => true),
  }

  utils = {
    sha3: () => 'a sha3 hash',
    fromWei: (x) => x / 1000000000000000000.0,
    toWei: (x) => x * 1000000000000000000.0,
  }
}

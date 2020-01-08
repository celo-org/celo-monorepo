// @ts-ignore
import * as ganache from '@celo/ganache-cli'

const network = require('./../../protocol/truffle-config.js').networks.development

export const ACCOUNT_PRIVATE_KEYS = network.ACCOUNT_PRIVATE_KEYS
export const ACCOUNT_ADDRESSES = network.ACCOUNT_ADDRESSES

export async function startGanache(datadir: string, opts: { verbose?: boolean } = {}) {
  const logFn = opts.verbose
    ? // tslint:disable-next-line: no-console
      (...args: any[]) => console.log(...args)
    : () => {
        /*nothing*/
      }

  const server = ganache.server({
    default_balance_ether: network.defaultBalance,
    logger: {
      log: logFn,
    },
    network_id: network.network_id,
    db_path: datadir,
    mnemonic: network.MNEMONIC,
    gasLimit: network.gas,
    allowUnlimitedContractSize: true,
  })

  await new Promise((resolve, reject) => {
    server.listen(network.port, (err: any, blockchain: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(blockchain)
      }
    })
  })

  return () =>
    new Promise((resolve, reject) => {
      server.close((err: any) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
}

export default function setup(dataDir: string) {
  return startGanache(dataDir)
    .then((stopGanache) => {
      ;(global as any).stopGanache = stopGanache
    })
    .catch((err) => {
      console.error('Error starting ganache, Doing `yarn test:prepare` might help')
      console.error(err)
      process.exit(1)
    })
}

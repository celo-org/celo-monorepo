#!/usr/bin/env ts-node

import program from 'commander'

import { migrateContracts } from '../e2e-tests/utils'

import { AccountType, getPrivateKeysFor, getValidatorsInformation } from '../lib/generate_utils'
import { GethRunConfig, runGethNodes } from '../lib/geth'

program
  .option('-g, --geth-repo <path>', 'Geth repo path')
  .option('-v, --validators <number>', 'Number of validators', '3')
  .option('-m, --migrations <number>', 'Number of migrations to be executed', '19')
  .option(
    '-w, --mnemonic <words>',
    'Mnemonic seed words',
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'
  )
  .option('-k, --keep-data', 'Skeps the clean up of the previous node data', 'true')
  .option('--test-dir <path>', 'Path to temporal data directory', '/tmp/e2e')
  .action(async () => {
    const { gethRepo, validators, migrations, mnemonic, keepData, testDir } = program

    await runTestNetwork({
      gethRepo,
      validators: +validators,
      migrations: +migrations,
      mnemonic,
      keepData,
      testDir,
    })
  })
  .parse(process.argv)

async function runTestNetwork({
  gethRepo: gethRepoPath,
  validators: numValidators,
  migrations: migrateTo,
  mnemonic,
  keepData,
  testDir: tmpDir,
}: {
  gethRepo: string
  validators: number
  migrations: number
  mnemonic: string
  keepData: boolean
  testDir: string
}) {
  // configure eth stats
  const ethstats = 'localhost:3000'
  const numEthstats = +numValidators

  // configure geth
  const gethConfig: GethRunConfig = {
    networkId: 1101,
    runPath: tmpDir,
    genesisPath: tmpDir + '/genesis.json',
    gethRepoPath,
    migrateTo,
    instances: [],
  }

  gethConfig.instances = [...Array(numValidators).keys()].map((index: number) => {
    return {
      gethRunConfig: gethConfig,
      name: `${index}-validator`,
      validating: true,
      syncmode: 'full',
      port: 30303 + index,
      rpcport: 8545 + index * 2,
      wsport: 8546 + index * 2,
      ethstats: index >= numEthstats ? '' : ethstats,
    }
  })

  // handle keys
  const attestationKeys = getPrivateKeysFor(AccountType.ATTESTATION, mnemonic, numValidators)
  const validators = getValidatorsInformation(mnemonic, numValidators)
  const validatorPrivateKeys = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, numValidators)

  // run the nodes
  await runGethNodes({
    keepData,
    gethConfig,
    validators,
    validatorPrivateKeys,
  })

  // do migration
  if (gethConfig.migrate || gethConfig.migrateTo) {
    await migrateContracts(
      validatorPrivateKeys,
      attestationKeys,
      validators.map((v) => v.address),
      gethConfig.migrateTo
    )
  }
}

import { ensureLeading0x, trimLeading0x } from '@celo/base'
import { readJsonSync, writeJsonSync } from 'fs-extra'
import {
  getProposedProxyAddress,
  isProxyRepointAndInitForIdTransaction,
} from '../lib/compatibility/verify-bytecode'
import { ProposalTx } from './truffle/make-release'

const makeRelease6Changes = (releaseProposal: ProposalTx[]) => {
  const stableTokenBRLaddr = getProposedProxyAddress('StableTokenBRL', releaseProposal)
  const exchangeInitIndex = releaseProposal.findIndex((tx) =>
    isProxyRepointAndInitForIdTransaction(tx, 'ExchangeBRLProxy')
  )
  const initCallData = trimLeading0x(releaseProposal[exchangeInitIndex].args[1])
  const paramPosition = (4 + 32) * 2 // (functionSelector + 1 parameter) * 2 hex
  releaseProposal[exchangeInitIndex].args[1] = ensureLeading0x(
    initCallData.slice(0, paramPosition) +
      trimLeading0x(stableTokenBRLaddr).padStart(64, '0') +
      initCallData.slice(paramPosition + 32 * 2) // offset 1 parameter * 2 hex
  )
  return releaseProposal
}

try {
  const argv: { input_proposal: string; output_proposal: string } = require('minimist')(
    process.argv.slice(2),
    {
      string: ['input_proposal', 'output_proposal'],
    }
  )
  const releaseProposal: ProposalTx[] = readJsonSync(argv.input_proposal)
  writeJsonSync(argv.output_proposal, makeRelease6Changes(releaseProposal), { spaces: 2 })
  console.info(`Modifications made sucessfully; written to ${argv.output_proposal}`)
} catch (e) {
  console.error(`Something went wrong: ${e instanceof Error ? JSON.stringify(e) : e?.toString()}`)
}

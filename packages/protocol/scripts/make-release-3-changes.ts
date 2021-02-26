import { ensureLeading0x, trimLeading0x } from '@celo/base'
import { readJsonSync, writeJsonSync } from 'fs-extra'
import {
  getProposedProxyAddress,
  isProxyRepointAndInitForIdTransaction,
} from '../lib/compatibility/verify-bytecode'
import { ProposalTx } from './truffle/make-release'

const proposalFile = 'release3_proposal_mock.json'

const releaseProposal: ProposalTx[] = readJsonSync(proposalFile)
const stableTokenEURaddr = getProposedProxyAddress('StableTokenEUR', releaseProposal)
const exchangeInitIndex = releaseProposal.findIndex((tx) =>
  isProxyRepointAndInitForIdTransaction(tx, 'ExchangeEURProxy')
)
const initCallData = trimLeading0x(releaseProposal[exchangeInitIndex].args[1])
const paramPosition = (4 + 32) * 2 // (functionSelector + 1 parameter) * 2 hex
releaseProposal[exchangeInitIndex].args[1] = ensureLeading0x(
  initCallData.slice(0, paramPosition) +
    trimLeading0x(stableTokenEURaddr).padStart(64, '0') +
    initCallData.slice(paramPosition + 32 * 2) // offset 1 parameter * 2 hex
)
const newFile = `modified_${proposalFile}`
writeJsonSync(newFile, releaseProposal, { spaces: 2 })
console.log(`Modified proposal written to ${newFile}`)

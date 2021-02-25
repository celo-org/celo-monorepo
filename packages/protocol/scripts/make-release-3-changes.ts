import fs = require('fs')
import {
  getProposedProxyAddress,
  isProxyRepointAndInitializeTransaction,
} from 'lib/compatibility/verify-bytecode'
import { ProposalTx } from './truffle/make-release'

const proposalFile = 'proposal.json'
const releaseProposal: ProposalTx[] = JSON.parse(fs.readFileSync(proposalFile, 'utf-8'))
const stableTokenEURaddr = getProposedProxyAddress('StableTokenEUR', releaseProposal)
const idx = releaseProposal.findIndex(
  (tx) => tx.contract === 'ExchangeEUR' && isProxyRepointAndInitializeTransaction(tx)
)
const exchangeEURinit = releaseProposal[idx]
const modifiedExchangeEURinit: ProposalTx = {
  contract: exchangeEURinit.contract,
  function: exchangeEURinit.function,
  value: exchangeEURinit.value,
  args: [
    // see Exchange.sol initialize
    exchangeEURinit.args[0],
    stableTokenEURaddr,
    ...exchangeEURinit.args.slice(2),
  ],
  description: `${exchangeEURinit.description} MODIFIED with knowledge of StableTokenEUR (proxy) address`,
}
const modifiedReleaseProposal = [
  ...releaseProposal.slice(0, idx),
  modifiedExchangeEURinit,
  ...releaseProposal.slice(idx + 1),
]
const newJSON = JSON.stringify(modifiedReleaseProposal, null, 2)
const newFile = `modified_${proposalFile}`
console.log(newJSON)
fs.writeFileSync(newFile, newJSON)
console.log(`Modified proposal written to ${newFile}`)

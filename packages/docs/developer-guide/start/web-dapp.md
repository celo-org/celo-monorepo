# React based DApp

This tutorial will be a basic guide on developing a decentralised application \(DApp\) on top of Celo. We'll be developing against one of the core Celo contracts, [Governance.sol](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/Governance.sol), and allowing users of our DApp to vote on active [Celo Governance proposals](https://docs.celo.org/celo-owner-guide/voting-governance).

## Foreword

This guide requires an understanding of a few popular web technologies. Our application will be written in [React](https://reactjs.org/), utilising [hooks](https://reactjs.org/docs/hooks-intro.html) for state management and built with [Next.js](https://nextjs.org/), a popular static site generation framework.

If you find this tutorial lacking in any way or want to dive into the code more thoroughly, checkout the [Celo Tools](https://github.com/alexbharley/celo-tools) GitHub repository where much of this tutorial has been ported from.

## Getting started

Step one of developing our application is scaffolding it out with `create-next-app` and adding TypeScript compilation so we can develop more confidently.

```bash
yarn create next-app voting-dapp
cd voting-dapp
touch tsconfig.json
yarn add --dev typescript @types/react @types/node
```

Now running `yarn dev` should open up our new Next.js website on `localhost:3000`.

Next we'll need to add a few Celo specific dependencies so we can work with our core contracts.

```bash
yarn add @celo/contractkit @celo-tools/use-contractkit bignumber.js
```

Here's what we'll be using each of these packages for:

* [@celo/contractkit](https://github.com/celo-org/celo-monorepo/tree/master/packages/sdk/contractkit) is a lightweight wrapper around the [Web3](https://web3js.readthedocs.io/) object you may already be familiar with. It contains typed interfaces for the core contracts \(generated from the Contract ABIs\) and helper functions to make common operations on Celo easier
* [@celo-tools/use-contractkit](https://github.com/celo-tools/use-contractkit) is a community provided library to ease establishing the connection with a user's wallet, whether that is a hardware, mobile, or web wallet. When developing with this library, your users can hold Celo via [Valora](https://valoraapp.com), a Ledger, Metamask and more
* [bignumber.js](https://github.com/MikeMcl/bignumber.js/) is a library for expressing large numbers in JavaScript. When interacting with a blockchain we often need to handle arbitrary-precision decimal and non-decimal arithmetic.

## Developing the application

After all our boilerplate has been setup, we're ready to start developing our application.

### Connecting to the user's wallet

When a user wants to interact with your DApp we need to somehow allow them to connect their wallet. Interaction with on chain smart contracts is impossible without this step.

Leveraging our previously added [@celo-tools/use-contractkit](https://github.com/celo-tools/use-contractkit) library we can provide a button that prompts the user to connect their wallet.

```javascript
import React from 'react'
import { useContractKit } from '@celo-tools/use-contractkit'

function App() {
  const { address, connect } = useContractKit()

  return (
    <main>
      <h1>Celo Voting DApp</h1>

      <button onClick={connect}>Click here to connect your wallet</button>
    </main>
  )
}
```

Clicking this button will show the `use-contractkit` modal and allow the user to connect with their wallet of choice. Once the modal has been dismissed, the `address` property exposed by `use-contractkit` will be filled with the users primary account.

### Accessing contracts

After that we've connected to the user's wallet we can show interesting information based on their address. In the context of a governance voting DApp it may make sense to show past proposals they've voted on. If we were creating a simple banking interface, we could imagine wanting to show transfers into and out of the users account.

{% hint style="info" %}
On the Celo blockchain, only queued and dequeued proposals are kept in the Governance state. That means to access old proposals we'd need to access an indexed history of the blockchain. This is out of scope for our tutorial however there's many resources online you can find that will help you accessing indexed blockchain state.

For a comprehensive look at how to interpret this on chain state, take a look at the implementation for the [celocli governance:list](https://github.com/celo-org/celo-monorepo/blob/master/packages/cli/src/commands/governance/list.ts) command.

For the purposes of this tutorial, we'll only be looking at dequeued proposals, or proposals we can currently vote on.
{% endhint %}

Here's how it looks using a combination of the `useEffect` and `useCallback` hooks to request and display all dequeued proposals from the blockchain.

```javascript
import React, { useCallback, useEffect } from 'react'
import { useContractKit } from '@celo-tools/use-contractkit'

function App() {
  const { address, connect, kit, getConnectedKit } = useContractKit()
  const [proposals, setProposals] = useState([])

  const fetchProposals = useCallback(async () => {
    const governance = await kit.contracts.getGovernance()
    const dequeue = await governance.getDequeue()

    const fetchedProposals = await Promise.all(
      dequeue.map(async (id) => ({ id, ...(await governance.getProposalRecord(id)) }))
    )
    setProposals(fetchedProposals)
  }, [kit])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Description URL</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal) => (
          <tr>
            <td>{proposal.id.toString()}</td>
            <td>{proposal.passed ? 'Passed' : proposal.approved ? 'Approved' : 'Not approved'}</td>
            <td>
              <a href={proposal.descriptionURL} target="_blank">
                Description link
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

This works pretty well however it makes sense to additionally show whether the user has voted on any given dequeued governance proposal. To show that information, we can amend our `fetchProposals` function as follows

```javascript
const fetchProposals = useCallback(async () => {
  if (!address) {
    return
  }

  const governance = await kit.contracts.getGovernance()
  const dequeue = await governance.getDequeue()

  const fetchedProposals = await Promise.all(
    dequeue.map(async (id) => {
      const [record, voteRecord] = await Promise.all([
        governance.getProposalRecord(id),
        governance.getVoteRecord(address, id),
      ])

      return {
        id,
        ...record,
        vote: voteRecord ? voteRecord.value : undefined,
      }
    })
  )
  setProposals(fetchedProposals)
}, [kit, address])
```

Now we have access to whether the user voted on this proposal, we can render that information in our table.

```javascript
return (
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Status</th>
        <th>Description URL</th>
        <th>Voted</th>
      </tr>
    </thead>
    <tbody>
      {proposals.map((proposal) => (
        <tr>
          <td>{proposal.id.toString()}</td>
          <td>{proposal.passed ? 'Passed' : proposal.approved ? 'Approved' : 'Not approved'}</td>
          <td>
            <a href={proposal.descriptionURL} target="_blank">
              Description link
            </a>
          </td>
          <td>{proposal.vote ?? 'No vote yet'}</td>
        </tr>
      ))}
    </tbody>
  </table>
)
```

### Locking Celo \(optional\)

A prerequisite to [voting on Celo governance proposals](../../celo-owner-guide/voting-governance.md) is having locked Celo to vote with. We won't cover the various flows for locking, unlocking and relocking Celo in this tutorial but you can check the implementation in [Celo Tools](https://github.com/alexbharley/celo-tools) or take inspiration from the following script:

```javascript
const lockValue = new BigNumber(res.flags.value)

const lockedGold = await this.kit.contracts.getLockedGold()
const pendingWithdrawalsValue = await lockedGold.getPendingWithdrawalsTotalValue(address)
const relockValue = BigNumber.minimum(pendingWithdrawalsValue, value)
const lockValue = value.minus(relockValue)

const txos = await lockedGold.relock(address, relockValue)
for (const txo of txos) {
  await kit.sendAndWaitForReceipt({ from: address })
}
```

All you need to take care of in your React application is handling user input to select the amount to lock and handling errors in case the user tries to lock more CELO than they hold.

It's also possible that users of your DApp already have locked CELO, so you might not need to worry about the complexity of permitting that operation.

### Voting on a proposal

To actually vote on a proposal we need to again interact with the [Governance.sol](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/Governance.sol) smart contract. Our logic for handling a vote looks as follows:

```typescript
const vote = useCallback(
  async (id: string, value: VoteValue) => {
    const kit = await getConnectedKit()
    const governance = await kit.contracts.getGovernance()
    await (await governance.vote(id, value)).sendAndWaitForReceipt()
    fetchProposals()
  },
  [kit, fetchProposals]
)
```

How you handle calling that function is up to you. With [Celo Tools](https://github.com/alexbharley/celo-tools) we opted for simple upwards and downwards facing arrows to handle voting on proposals, however the data can be rendered however you'd prefer.

Here's a simple example showing buttons for `Yes` or `No` votes when no vote has been cast.

```javascript
import { VoteValue } from '@celo/contractkit/lib/wrappers/Governance'

return (
  <tr>
    <td>{proposal.id.toString()}</td>
    <td>{proposal.passed ? 'Passed' : proposal.approved ? 'Approved' : 'Not approved'}</td>
    <td>
      <a href={proposal.descriptionURL} target="_blank">
        Description link
      </a>
    </td>
    <td>
      {proposal.vote ? (
        <span>{proposal.vote}</span>
      ) : (
        <div>
          <button onClick={() => vote(proposal.id, VoteValue.Yes)}>Yes</button>
          <button onClick={() => vote(proposal.id, VoteValue.No)}>No</button>
        </div>
      )}
    </td>
  </tr>
)
```

## Best practices

We've compiled a short list on best practices to follow when developing DApps. Following these will improve the end user experience and keep them more engaged with the Celo ecosystem. If you have any questions around these, feel free to [reach out on Discord](https://chat.celo.org), we're always there and happy to chat.

### Last used address

[@celo-tools/use-contractkit](https://github.com/celo-tools/use-contractkit) will remember the address a user last logged in with \(via [browser LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)\). Use this to your advantage and allow your DApp to display the same data whether or not the user has connected their wallet. A good test is to refresh your DApp after connecting and see if anything changes. At the very most, buttons for interaction could be disabled, however it's preferable to prompt to connect the wallet on button click.

Keeping the UI consistent by using the last connected address is a quick win we can have with DApps that make the experience using them closer to Web2, an experience more users will be familiar with.

### Loading states

Loading times are often the give away that an application is a Web3 DApp. Be liberal with loading screens and prioritise making animations smooth.

Nothing is worse than a perpetually hanging screen that takes multiple seconds to become interactive. By showing a spinner it communicates to the user that things are happening, however slow they may be.

This is often offset by the ability to index a blockchain and provide the data in a more accessible format \(maybe a SQL database or behind a GraphQL API\). As mentioned earlier we haven't covered that in this tutorial, however there's a lot of content on the web around DApp optimisation through prior state indexing.

### Prerender what you can

With modern static site generators we have amazing leverage over what gets computed server side and what the browser has to request and compute before rendering. If you're unable to index the blockchain before a client requests access to a page, consider loading the relevant data server side with a cache invalidated every hour or so.

Next.js [getStaticProps](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) comes to mind here as a great way to offload heavy computation to the server.

### Showing numbers in wei vs. Celo vs. local currency

Take this advice with a grain of salt as it really depends on how familiar with cryptocurrencies and blockchain your users are. At some point in most DApp users are going to need to deal with large numbers. It's up to you whether you display these in wei \(1e18\) CELO or converted to a currency the user prefers \(BTC, USD or EUR for example\).

The sweeping generalisation would be to allow entering values in CELO or their preferred currency and never expose the raw wei amounts to end users.

## Wrapping up

Hopefully you have a better grasp on developing DApps against the Celo core contracts now. In this tutorial we covered:

* Connecting to user wallets \([use-contractkit](https://github.com/celo-tools/use-contractkit)\)
* Fetching on-chain data
* Calling simple functions on the core contracts
* A brief word on best practices with regard to DApp development.

This is not a comprehensive tutorial for Celo's features and capabilities, keep exploring the docs to learn more and please [connect with us on Discord](https://chat.celo.org) if you need any help \(or just want to chat\)!


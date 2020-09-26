# Smart Contracts Release Process

{% hint style="warning" %}
This release process is a work in progress. Many infrastructure components required to execute it are not in place, and the process itself is subject to change.
{% endhint %}

## Versioning
Each deployed Celo core smart contract is versioned independently, according to semantic versioning, as described at [semver.org](https://semver.org), with the following modifications:

  * STORAGE version when you make incompatible storage layout changes
  * MAJOR version when you make incompatible ABI changes
  * MINOR version when you add functionality in a backwards compatible manner, and
  * PATCH version when you make backwards compatible bug fixes.

Changes to core smart contracts are made via on-chain Governance, approximately four times a year. When a release is made, **all** smart contracts from the release branch that differ from the deployed smart contracts are released, and included in the **same** governance proposal.

### Mixins and libraries
Mixin contracts and libraries are considered part of the contracts that consume them. When a mixin or library has changed, all contracts that consume them should be considered to have changed as well, and thus the contracts should have their version numbers incremented and should be re-deployed as part of the next smart contract release.

## Identifying releases

Each release is identified by a unique monotonically increasing number `N`, with `1` being the first release.

### Contracts
Every deployed smart contract has its current version number as a constant which is publicly accessible via the `getVersion()` function, which returns the storage, major, minor, and patch version. Version number is encoded in the Solidity source and updated as part of code changes.

Contracts deployed to a live network without the `getVersion()` function, such as the original set of core contracts, are to be considered version `1.0.0.0`.

### Git branches
Every smart contract release has a designated branch, e.g. `release/contracts/N` in the celo-monorepo.

Ongoing smart contract development is done on the `master` branch.

### Github tags
All release branches should be tagged as such, e.g. `celo-contracts-N`. Each should include a summary of the release contents.

## Build process
A new release can be built by running the following script:

```bash
yarn run release-contracts -d $CURRENTLY_RELEASED_BRANCH -f $FROM_ADDRESS -n $NETWORK
```

This script does the following:

  1. Compiles the contracts at `$CURRENTLY_RELEASED_BRANCH` and confirms that the compiled bytecode matches what is currently deployed on the specified network.
  2. Compiles the contracts in the current branch and checks backwards compatibility with what is currently deployed on the specified network, with the following exceptions:
     1. If the STORAGE version has changed, does not perform backwards compatibility checks
     2. If the MAJOR version has changed, checks that the storage layout is backwards compatible, but does not check that the contract ABI is backwards compatible.
  3. For contracts that have changed, confirms that the version number in the current branch is strictly greater than the deployed version number.
  4. For contracts that have not changed, confirms that the version number in the current branch is exactly the same as the deployed version number
  5. For contracts that have changed, deploys those contracts to the specified network.
  6. Creates and submits a single governance proposal to upgrade to the newly deployed contracts.
     1. STORAGE updates are adopted by deploying a new proxy and implementation and updating the Registry contract.
     2. All other updates are adopted by updating the proxy contract’s implementation pointer.

## Testing

All releases should be evaluated according to the following tests.

### Unit tests
All changes since the last release should be covered by unit tests. Unit test coverage should be enforced by automated checks run on every commit.

### Performance
A ceiling on the gas consumption for all common operations should be defined and enforced by automated checks run on every commit.

### Backwards compatibility
Automated checks should ensure that any new commit to `master` does not introduce a breaking change to storage layout, ABI, or other common backwards compatibility issues unless the STORAGE or MAJOR version numbers are incremented.

Backwards compatibility tests will also be run before every release to confirm that no breaking changes exist between the pending release and deployed smart contracts.

### Audits
All changes since the last release should be audited by a reputable third party auditor.

### Emergency patches

If patches need to be applied before the next scheduled smart contract release, they should be cherry picked to a new release branch, branched from the latest deployed release branch.

## Promotion process

Deploying a new contract release should occur with the following process:

<table>
  <tr>
    <td>Date</td>
    <td>Action</td>
  </tr>
  <tr>
    <td>T</td>
    <td>
      <ol>
        <li>Create a <code>release/contracts/N</code> branch at the desired commit.</li>
        <li>Submit this branch to a reputable third party auditor for review.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+1w</td>
    <td>
      <ol>
        <li>Receive report from auditors.</li>
        <li>If all issues in the audit report have straightforward fixes, announce a forthcoming smart contract release. </li>
        <li>Commit audit fixes to <code>master</code> and cherry-pick to the release branch.</li>
        <li>Submit audit fixes to auditors for review.</li>
        <li>Let the community know about the upcoming release proposal by posting details to the Governance category on https://forum.celo.org and cross post in the <a href="https://discord.com/channels/600834479145353243/704805825373274134">Discord <code>#governance</code> channel</a>. See the 'Communication guidelines' section below for information on what your post should contain.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+2w</td>
    <td>
      <ol>
        <li>Tag the release on Github.</li>
        <li>Run the smart contract release script to deploy the contracts to Baklava and submit a governance proposal.</li>
        <li>Update your forum post with the Baklava <code>PROPOSAL_ID</code>, updated timings (if any changes), and notify the community in the Discord <code>#governance</code> channel.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+3w</td>
    <td>
      <ol>
        <li>Confirm all contracts working as intended on Baklava.</li>
        <li>Run the smart contract release script to deploy the contracts to Alfajores and submit a governance proposal.</li>
        <li>Update your forum post with the Alfajores <code>PROPOSAL_ID</code>, updated timings (if any changes), and notify the community in the Discord <code>#governance</code> channel.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+4w</td>
    <td>
      <ol>
        <li>Confirm all contracts working as intended on Alfajores.</li>
        <li>Confirm audit is complete and make sure your forum post contains a link to it.</li>
        <li>Run the smart contract release script to deploy the contracts to Mainnet and submit a governance proposal.</li>
         <li>Update your forum post with the Mainnet <code>PROPOSAL_ID</code>, updated timings (if any changes), and notify the community in the Discord <code>#governance</code> channel.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+5w</td>
    <td>
      <ol>
        <li>Confirm all contracts working as intended on Mainnet.</li>
         <li>Update your forum post with the Mainnet governance outcome (<code>Passed</code> or <code>Rejected</code>) and notify the community in the Discord <code>#governance</code> channel.</li>
      </ol>
    </td>
  </tr>
</table>

If the contents of the release (i.e. source Git commit) change at any point after the release has been tagged in Git, the process should increment the release identifier, and process should start again from the beginning. If the changes are small or do not introduce new code (e.g. reverting a contract to a previous version) the audit step may be accelerated.

### Communication guidelines

Communicating the upcoming governance proposal to the community is critical and may help getting it approved. 

Each smart contract release governance proposal should be accompanied by a [Governance category](https://forum.celo.org/c/governance/) forum post that contains the following information:
* Name of proposer (individual contributor or organization).
* Background information.
* Link to the release notes.
* Link to the audit report(s).
* Anticipated timings for the Baklava and Alfajores testnets and Mainnet.

It's recommended to post as early as possible and at minimum one week before the anticipated Baklava testnet governance proposal date. 

Make sure to keep the post up to date. All updates (excluding fixing typos) should be communicated to the community in the [Discord](http://chat.celo.org/) `#governance` channel.

### Emergency patches

{% hint style="warning" %}
Work in progress
{% endhint %}

## Vulnerability Disclosure

Vulnerabilities in smart contract releases should be disclosed according to the [security policy](https://github.com/celo-org/celo-monorepo/blob/master/SECURITY.md).

## Dependencies
None

## Dependents

{% hint style="warning" %}
Work in progress
{% endhint %}


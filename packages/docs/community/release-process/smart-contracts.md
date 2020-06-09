# Smart Contracts Release Process

## Versioning
Each deployed Celo core smart contract is versioned independently, according to semantic versioning, as described at semver.org, with the following modifications:

  * STORAGE version when you make incompatible storage layout changes
  * MAJOR version when you make incompatible ABI changes
  * MINOR version when you add functionality in a backwards compatible manner, and
  * PATCH version when you make backwards compatible bug fixes.

Changes to core smart contracts are made via on-chain governance, approximately four times a year. When a release is made, **all** smart contracts from the release branch that differ from the deployed smart contracts are released, and included in the **same** governance proposal.

### Mixins and libraries
Mixin contracts and libraries are considered part of the contracts that consume them. When a mixin or library has changed, all contracts that consume them should be considered to have changed as well, and thus the contracts should have their version numbers incremented and should be re-deployed as part of the next smart contract release.

## Identifying releases

Each release is identified by a unique monotonically increasing number `N`, with 1 being the first release.

### Contracts
Every deployed smart contract has its current version number as a constant which is publicly accessible via the `getVersion()` function, which returns the storage, major, minor, and patch version. Version number is encoded in the Solidity source and updated as part of code changes.

Contracts deployed to a live network without the `getVersionNumber()` functions, such as the original set of core contracts, are to be considered version 1.0.0.0.

### Git branches
Every smart contract release has a designated branch, e.g. `release/contracts/N` in the celo-monorepo.

Ongoing smart contract development is done on the `master` branch.

### Github tags
All release branches should be tagged as such, e.g. `celo-contracts-N`. Each should include a summary of the release contents.

## Build process
A new release can be built by running the following script:

```
yarn run release-contracts -d CURRENTLY_RELEASED_BRANCH -f FROM_ADDRESS -n NETWORK
```

This script does the following:

  1. Compiles the contracts at `CURRENTLY_RELEASED_BRANCH` and confirms that the compiled bytecode matches what is currently deployed on the specified network.
  2. Compiles the contracts in the current branch and checks backwards compatibility with what is currently deployed on the specified network, with the following exceptions:
  3. If the STORAGE version has changed, does not perform backwards compatibility checks
  4. If the MAJOR version has changed, checks that the storage layout is backwards compatible, but does not check that the contract ABI is backwards compatible.
  5. For contracts that have changed, confirms that the version number in the current branch is strictly greater than the deployed version number.
  6. For contracts that have not changed, confirms that the version number in the current branch is exactly the same as the deployed version number
  7. For contracts that have changed, deploys those contracts to the specified network.
  8. Creates and submits a single governance proposal to upgrade to the newly deployed contracts.
    1. STORAGE updates are adopted by deploying a new proxy and implementation and updating the Regsitry contract.
    2. All other updates are adopted by updating the proxy contract’s implementation pointer.

## Testing 

All releases should be evaluated according to the following tests.

### Unit tests
All changes since the last release should be covered by unit tests. CI rules should be updated to enforce this.

### Performance
A ceiling on the gas consumption for all common operations should be defined and enforced by CI.

### Backwards compatibility
Automated checks should ensure that any new commit to `master` does not introduce a breaking change to storage layout, ABI, or other common backwards compatibility issues unless the STORAGE or MAJOR version numbers are incremented.

Backwards compatibility tests will also be run before every release to confirm that no breaking changes exist between the pending release and deployed smart contracts.

### Audits
All changes since the last release should be audited by a reputable third party auditor.

### Emergency patches

If patches need to be applied before the next scheduled smart contract release, they should be cherry picked to a new release branch, branched from the latest deployed release branch. 

## Promotion process 

To fork development from `master`, follow these steps:

<table>
  <tr>
    <td>Date</td>
    <td>Action</td>
  </tr>
  <tr>
    <td>T</td>
    <td>
      <ol>
        <li>Create a `release/contracts/N` branch at the desired commit.</li>
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
        <li>Commit audit fixes to `master` and cherry-pick to the release branch.</li>
        <li>Submit audit fixes to auditors for review. </li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+2w</td>
    <td>
      <ol>
        <li>Tag the release on Github.</li>
        <li>Run the smart contract release script to deploy the contracts to Baklava and submit a governance proposal.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+3w</td>
    <td>
      <ol>
        <li>Confirm all contracts working as intended on Baklava.</li>
        <li>Run the smart contract release script to deploy the contracts to Alfajores and submit a governance proposal.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+4w</td>
    <td>
      <ol>
        <li>Confirm all contracts working as intended on Alfajores.</li>
        <li>Run the smart contract release script to deploy the contracts to mainnet and submit a governance proposal.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+5w</td>
    <td>
      <ol>
        <li>Confirm all contracts working as intended on mainnet.</li>
      </ol>
    </td>
  </tr>
</table>

If the contents of the release (i.e. the source Git commit) change at any point after the release has been tagged on Github, the process should increment the release identifier, and process should start again from the beginning. If the changes are small or do not introduce new code (e.g. reverting a contract to a previous version) the audit step may be accelerated.

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


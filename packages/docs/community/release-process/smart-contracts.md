# Smart Contracts Release Process

{% hint style="warning" %}
This release process is a work in progress. Many infrastructure components required to execute it are not in place, and the process itself is subject to change.
{% endhint %}

## Versioning

Each deployed Celo core smart contract is versioned independently, according to semantic versioning, as described at [semver.org](https://semver.org), with the following modifications:

- STORAGE version when you make incompatible storage layout changes
- MAJOR version when you make incompatible ABI changes
- MINOR version when you add functionality in a backwards compatible manner, and
- PATCH version when you make backwards compatible bug fixes.

Changes to core smart contracts are made via on-chain Governance, approximately four times a year. When a release is made, **all** smart contracts from the release branch that differ from the deployed smart contracts are released, and included in the **same** governance proposal. Each release is identified by a unique monotonically increasing version number `N`, with `1` being the first release.

### Core Contracts

Every deployed Celo core contract has its current version number as a constant which is publicly accessible via the `getVersion()` function, which returns the storage, major, minor, and patch version. Version number is encoded in the Solidity source and updated as part of code changes.

Celo Core Contracts deployed to a live network without the `getVersion()` function, such as the original set of core contracts, are to be considered version `1.1.0.0`.

### Mixins and libraries

Mixin contracts and libraries are considered part of the contracts that consume them. When a mixin or library has changed, all contracts that consume them should be considered to have changed as well, and thus the contracts should have their version numbers incremented and should be re-deployed as part of the next smart contract release.

### Initialize Data

Whenever Celo Core Contracts need to be re-initialized, their initialization arguments should be checked into version control under `packages/protocol/releaseData/initializationData/release${N}.json`.

### Release management in Git/Github

Github branches/tags and Github releases are used to coordinate past and ongoing releases. Ongoing smart contract development is done on the `master` branch (even after release branches are cut). Every smart contract release has a designated release branch, e.g. `release/celo-core-contracts/${N}` in the celo-monorepo.

#### When a new release branch is cut:
1. A new release branch is created `release/celo-core-contracts/${N}` with the contracts to be audited.
2. The latest commit on the release branch is tagged with `celo-core-contracts-v${N}.pre-audit`.
3. On Github, a pre-release Github release should be created pointing at the latest tag on the release branch.
4. On master branch, `.circleci/config.yml` should be edited so that the variable `RELEASE_TAG` points to the tag `celo-core-contracts-v${N}.pre-audit` so that all future changes to master are versioned against the new release.
5. Ongoing audit responses/fixes should continue to go into `release/celo-core-contracts/${N}`.

#### During the release proposal stage:
1. Whenever release candidates are available they should be tagged `celo-core-contracts-v${N}.rc1`, `...rc2`, etc.
2. When a release is getting proposed on a Baklava/Alfajores/Mainnet, the commit that was used (which should be the latest release candidate) should be tagged with `celo-core-contracts-v${N}.(baklava | alfajores | mainnet)`.

#### After a completed release process:
1. The release branch should be merged into `master` with a merge commit (instead of the usual squash merge strategy).
2. On master branch, `.circleci/config.yml` should be edited so that the variable `RELEASE_TAG` points to the tag `celo-core-contracts-v${N}.mainnet`


## Release Process

There are several scripts provided (under `packages/protocol` in [celo-org/celo-monorepo](https://github.com/celo-org/celo-monorepo) and via [celocli](../../command-line-interface/introduction.md)) for use in the release process and with contract upgrade governance proposals to give participating stakeholders increased confidence.

{% hint style="warning" %}​
For these to run, you may need to follow the [setup instructions](https://github.com/celo-org/celo-monorepo/blob/master/SETUP.md). These steps include installing Node and setting `nvm` to use the correct version of Node. Successful `yarn install` and `yarn build` in the protocol package signal a completed setup.
{% endhint %}

Using these tools, a contract release candidate can be built, deployed, and proposed for upgrade automatically on a specified network. Subsequently, stakeholders can verify the release candidate against a governance upgrade proposal's contents on the network.

### Verify Release on Network

Use the following script to compile contracts at a release tag and verify that the deployed network bytecode matches the compiled bytecode.
```bash
NETWORK=${"baklava"|"alfajores"|"mainnet"}
PREVIOUS_RELEASE="celo-core-contracts-v${N-1}.${NETWORK}"
# A -f boolean flag can be provided to use a forno full node to connect to the provided network
yarn verify-deployed -n $NETWORK -b $PREVIOUS_RELEASE -f
```

### Check Backward Compatibility

Use the following script to compile candidate and current release contracts to check storage layout and ABI backwards compatibility, subject to the following exceptions:
  1. If the STORAGE version has changed, does not perform backwards compatibility checks
  2. If the MAJOR version has changed, checks storage layout compatibility but not ABI compatibility

For changed contracts, checks that new version number is strictly greater than previous release. For unchanged contracts, checks that version number exactly matches previous release. Outputs a JSON backwards compatibility report.

```bash
NETWORK=${"baklava"|"alfajores"|"mainnet"}
PREVIOUS_RELEASE="celo-core-contracts-v${N-1}.${NETWORK}"
RELEASE_CANDIDATE="celo-core-contracts-v${N}.rc${X}"
yarn check-versions -a $PREVIOUS_RELEASE -b $RELEASE_CANDIDATE -r "report.json"
```

This should be used in tandem with `verify-deployed -b $PREVIOUS_RELEASE -n $NETWORK` to ensure the compatibility checks compare the release candidate to what is actually active on the network.

### Deploy New Contracts

Use the following script to build a candidate release and, using the corresponding backwards compatibility report, deploy **changed** contracts to the specified network. (Use `-d` to dry-run the deploy).
STORAGE updates are adopted by deploying a new proxy/implementation pair. These new contracts may need to be initialized, for which values can be provided. Outputs a JSON contract upgrade governance proposal.

```bash
NETWORK=${"baklava"|"alfajores"|"mainnet"}
RELEASE_CANDIDATE="celo-core-contracts-v${N}.rc${X}"
yarn make-release -b $RELEASE_CANDIDATE -n $NETWORK -r "report.json" -i "releaseData/initializationData/release${N}.json" -p "proposal.json"
```

The proposal encodes STORAGE updates by repointing the Registry to the new proxy. Storage compatible upgrades are encoded by repointing the existing proxy's implementation.

### Submit Upgrade Proposal

Submit the autogenerated upgrade proposal to the Governance contract for review by voters, outputting a unique identifier.

```bash
# resultant proposal ID should be communicated publicly
celocli governance:propose <...> --jsonTransactions "proposal.json"
```

### Fetch Upgrade Proposal

Fetch the upgrade proposal and output the JSON encoded proposal contents.

```bash
celocli governance:show --proposalID <proposalId> --jsonTransactions "upgrade_proposal.json"
```

### Verify Proposed Release

Verify that the proposed upgrade activates contract addresses which match compiled bytecode from the tagged release candidate exactly. Include initialization data from the CGP to verify via (add `-i initialization_data.json` in that case)

```bash
RELEASE_CANDIDATE="celo-core-contracts-v${N}.rc${X}"
NETWORK=${"baklava"|"alfajores"|"mainnet"}
# A -f boolean flag can be provided to use a forno full node to connect to the provided network
yarn verify-release -p "upgrade_proposal.json" -b $RELEASE_CANDIDATE -n $NETWORK -f
```

### Verify Executed Release

After a release executes via Governance, you can verify that the resulting network state reflects the tagged release candidate

```bash
RELEASE="celo-core-contracts-v${N}.rc${X}"
NETWORK=${"baklava"|"alfajores"|"mainnet"}
yarn verify-deployed -n $NETWORK -b $RELEASE -f
```

## Testing

All releases should be evaluated according to the following tests.

### Unit tests

All changes since the last release should be covered by unit tests. Unit test coverage should be enforced by automated checks run on every commit.

### Manual Checklist

After a successful release execution on a testnet, the resulting network state should be spot-checked to ensure that no regressions have been caused by the release. Flows to test include:

- Do a cUSD and CELO transfer
    ```bash
    celocli transfer:dollars --from <addr> --value <number> --to <addr>
    celocli transfer:celo --from <addr> --value <number> --to <addr>
    ```
- Register a Celo account
    ```bash
    celocli account:register --from <addr> --name <test-name>
    ```
- Report an Oracle rate
    ```bash
    celocli oracle:report --from <addr> --value <num>
    ```
- Do a CP-DOTO exchange
    ```bash
    celocli exchange:celo --value <number> --from <addr>
    celocli exchange:dollars --value <number> --from <addr>
    ```
- Complete a round of attestation
- Redeem from Escrow
- Register a Vaildator
    ```bash
    celocli validator:register --blsKey <hexString> --blsSignature <hexString> --ecdsaKey <hexString> --from <addr>
    ```
- Vote for a Validator
- Run a mock election
    ```bash
    celocli election:run
    ```
- Get a valildator slashed for downtime and ejected from the validator set
- Propose a governance proposal and get it executed
    ```bash
    celocli governance:propose --jsonTransactions <jsonFile> --deposit <number> --from <addr> --descriptionURL https://gist.github.com/yorhodes/46430eacb8ed2f73f7bf79bef9d58a33
    ```

### Automated environment tests

Stakeholders can use the `env-tests` package in `celo-monorepo` to run an automated test suite against the network

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

Deploying a new contract release should occur with the following process. On-chain governance proposals should be submitted on Tuesdays for consistency and predictability.

<table>
  <tr>
    <td>Date</td>
    <td>Action</td>
  </tr>
  <tr>
    <td>T</td>
    <td>
      <ol>
        <li>Create a Github issue tracking all these checklist items as an audit log</li>
        <li>Implement the <a href="#When-a-new-release-branch-is-cut">git management steps</a> for when a new release branch is cut.</li>
        <li>Submit release branch to a reputable third party auditor for review.</li>
        <li>Begin drafting release notes.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+1w</td>
    <td>
      <ol>
        <li>Receive report from auditors.</li>
        <li>Add audit summary to final draft of the release notes.</li>
        <li>If all issues in the audit report have straightforward fixes:
          <ol>
            <li> Submit a governance proposal draft using this format: https://github.com/celo-org/celo-proposals/blob/master/CGPs/template.md</li>
            <li> Add any initialization data to the CGP that should be included as part of the proposal</li>
            <li> Announce forthcoming smart contract release on: https://forum.celo.org/c/governance</li>
          </ol>
        </li>
        <li>Commit audit fixes to the release branch</li>
        <li>Submit audit fixes to auditors for review.</li>
        <li>Tag the first release candidate commit according to the <a href="#During-the-release-proposal-stage">git release management instructions</a>.</li>
        <li>Let the community know about the upcoming release proposal by posting details to the Governance category on https://forum.celo.org and cross post in the <a href="https://discord.com/channels/600834479145353243/704805825373274134">Discord <code>#governance</code> channel</a>. See the 'Communication guidelines' section below for information on what your post should contain.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+2w</td>
    <td>
      <ol>
        <li>On Tuesday: Run the <a href="#build-and-release-process">smart contract release script</a> in order to to deploy the contracts to Baklava as well as submit a governance proposal.
         <ul>
          <li>Transition proposal through Baklava <a href="https://docs.celo.org/celo-codebase/protocol/governance"> governance process.</a></li>
          <li>Tag the commit that is being proposed with <code>celo-core-contracts-v${N}.baklava</code></li>
         </ul>
       </li>
       <li>Update your forum post with the Baklava <code>PROPOSAL_ID</code>, updated timings (if any changes), and notify the community in the Discord <code>#governance</code> channel.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+3w</td>
    <td>
      <ol>
        <li>Confirm all contracts working as intended on Baklava.</li>
        <li>Run the <a href="https://docs.celo.org/community/release-process/smart-contracts#build-process">smart contract release script</a> in order to to deploy the contracts to Alfajores as well as submit a governance proposal.</li>
        <li>Tag the commit that is being proposed with <code>celo-core-contracts-v${N}.alfajores</code></li>
        <li>Update your forum post with the Alfajores <code>PROPOSAL_ID</code>, updated timings (if any changes), and notify the community in the Discord <code>#governance</code> channel.</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+4w</td>
    <td>
      <ol>
        <li>Confirm all contracts working as intended on Alfajores.</li>
        <li>Confirm audit is complete and make the release notes and forum post contain a link to it.</li>
        <li>On Tuesday: Run the <a href="https://docs.celo.org/community/release-process/smart-contracts#build-process">smart contract release script</a> in order to to deploy the contracts to Mainnet as well as submit a governance proposal.</li>
        <li>Tag the commit that is being proposed with <code>celo-core-contracts-v${N}.mainnet</code></li>
        <li>Update the corresponding governance proposal with the updated on-chain <code>PROPOSAL_ID</code> and mark CGP status as "PROPOSED".</li>
        <li>Update your forum post with the Mainnet <code>PROPOSAL_ID</code>, updated timings (if any changes), and notify the community in the Discord <code>#governance</code> channel.</li>
        <li>At this point all stakeholders are encouraged to <a href="#verify-release-process">verify</a> the proposed contracts deployed match the contracts from the release branch.</li>
        <li>Monitor the progress of the proposal through the <a href="https://docs.celo.org/celo-codebase/protocol/governance">governance process.</a>
         <ul>
          <li>Currently the governance process should take approximately 1 week: 24 hours for the dequeue process, 24 hours for the approval process, and 5 days for the referendum process. After which, the proposal is either declined or is ready to be executed within 3 days.</li>
          <li>For updated timeframes, use the celocli: <code>celocli network:parameters</code></li>
        </ul>
       </li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+5w</td>
    <td>
      <ol>
        <li>If the proposal passed:
         <ol>
           <li>Confirm all contracts working as intended on Mainnet.</li>
           <li>Update your forum post with the Mainnet governance outcome (<code>Passed</code> or <code>Rejected</code>) and notify the community in the Discord <code>#governance</code> channel.</li>
           <li>Change corresponding CGP status to EXCECUTED.</li>
           <li>Merge the release branch into <code>master</code> with a merge commit</li>
         </ol>
        <li>If the proposal failed:
         <ol>
          <li>Change corresponding CGP status to EXPIRED.</li>
         </ol>
        </li>
      </ol>
    </td>
  </tr>
</table>

If the contents of the release (i.e. source Git commit) change at any point after the release has been tagged in Git, the process should increment the release identifier, and process should start again from the beginning. If the changes are small or do not introduce new code (e.g. reverting a contract to a previous version) the audit step may be accelerated.

### Communication guidelines

Communicating the upcoming governance proposal to the community is critical and may help getting it approved.

Each smart contract release governance proposal should be accompanied by a [Governance category](https://forum.celo.org/c/governance/) forum post that contains the following information:

- Name of proposer (individual contributor or organization).
- Background information.
- Link to the release on Github.
- Link to the audit report(s).
- Anticipated timings for the Baklava and Alfajores testnets and Mainnet.

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

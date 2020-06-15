import HomePage from 'pages/index'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

const MILESTONES = [
  {
    title: 'Mainnet Mobile Wallet Release',
    text: 'The Mainnet Mobile Wallet will be fully available for download on iOS and Android',
    status: 2,
  },
  {
    title: 'Celo Dollars Live',
    text:
      'When Oracles can provide pricing for Celo Gold, Celo Dollar transfers can be enabled via on-chain governance proposal',
    status: 2,
  },
  {
    title: 'Celo Gold Live',
    text:
      'When the network is running smoothly, Celo Gold transfers can be enabled via on-chain governance proposal',
    status: 2,
  },
  {
    title: 'Mainnet Release Candidate X',
    text: 'Possible additional release candidates in the event critical issues are discovered',
    status: 2,
  },
  {
    title: 'Celo Gold Voter Rewards Activate',
    text: 'Voter rewards enabled via on-chain governance proposal',
    status: 2,
  },
  {
    date: 'April 2020',
    title: 'Validator Elections Start',
    text:
      'With validators and groups registered and staked, validator elections and epoch rewards enabled via on-chain governance proposal',
    status: 0,
  },
  {
    date: 'April 2020',
    title: 'Mainnet Release Candidate 1',
    text: 'Validators stand up release candidate network with production-ready software',
    status: 0,
  },
  {
    date: 'April 2020',
    title: 'Security Audits Complete',
    text: 'Resolve any outstanding issues to harden codebase',
    status: 0,
  },
  {
    date: 'April 2020',
    title: 'New Baklava Testnet',
    text: 'Validators stand up new testnet with feature complete software',
    status: 0,
  },
  {
    date: 'Feb 2020',
    title: 'SDK Release',
    text: 'ContractKit and DAppKit simplify development of dApps',
    status: 0,
  },
  {
    date: 'Nov 2019 - Feb 2020',
    title: 'Baklava Testnet – The Great Celo Stake Off',
    text:
      'Validators gain operational experience and chance to earn Mainnet Celo Gold, software hardened',
    status: 0,
  },
  {
    date: 'Sep 2019',
    title: '100th Community Event',
    text: '100 events hosted in 100 days in more than 35 countries',
    status: 0,
  },
  {
    date: 'July 2019',
    title: 'Alfajores Testnet Release',
    text: 'First full network release for protocol and app developers',
    status: 0,
  },
  {
    date: 'Feb 2019',
    title: 'MIT Stability Challenge',
    text: 'Stability Protocol tested and improved',
    status: 0,
  },
  {
    date: 'Dec 2018',
    title: 'Mobile Wallet in Market Testing Begins',
    text: 'Ongoing research in emerging markets',
    status: 0,
  },
  {
    date: 'Aug 2018',
    title: 'First User Research Trip',
    text: 'Field research on mobile money adoption in Kenya',
    status: 0,
  },
]

describe('HomePage', () => {
  it('renders', async () => {
    const tree = renderer
      .create(
        <TestProvider>
          <HomePage milestones={MILESTONES} />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})

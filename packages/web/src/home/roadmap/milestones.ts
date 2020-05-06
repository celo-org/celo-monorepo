export enum Status {
  complete,
  inprogress,
  unstarted,
}

interface Stone {
  key: string
  date?: string
}

interface DoneStone extends Stone {
  status: Status.complete
  date: string
}

interface FutureStone extends Stone {
  status: Status.inprogress | Status.unstarted
}

export type Milestone = FutureStone | DoneStone

const stones: Milestone[] = [
  {
    key: 'Mainnet_Release_Candidate_1',
    status: Status.complete,
    date: 'April 2020',
  },
  {
    key: 'Security_audits_complete',
    status: Status.complete,
    date: 'April 2020',
  },
  {
    key: 'New_Baklava_Testnet',
    status: Status.complete,
    date: 'April 2020',
  },
  {
    key: 'Validator_Elections_Start',
    status: Status.inprogress,
  },
  {
    key: 'Rewards_Activated',
    status: Status.unstarted,
  },
  {
    key: 'Mainnet_Release_Candidate_X',
    status: Status.unstarted,
  },
  {
    key: 'Celo_Gold_is_live',
    status: Status.unstarted,
  },
  {
    key: 'Celo_Dollar_is_live',
    status: Status.unstarted,
  },
  {
    key: 'Mainnet_Mobile_Wallet_Release',
    status: Status.unstarted,
  },

  {
    date: 'Feb 2020',
    key: 'SDK_Release',
    status: Status.complete,
  },
  {
    date: 'Nov 2019 - Feb 2020',
    key: 'Baklava_Testnet',
    status: Status.complete,
  },
  {
    date: 'Sep 2019',
    key: '100_Community',
    status: Status.complete,
  },
  {
    date: 'July 2019',
    key: 'Alfajores_Testnet',
    status: Status.complete,
  },
  {
    date: 'Feb 2019',
    key: 'MIT_Stability_Challenge',
    status: Status.complete,
  },
  {
    date: 'Dec 2018',
    key: 'Wallet_in_market_testing_begins',
    status: Status.complete,
  },
  {
    date: 'Aug 2018',
    key: 'First_user_research_trip',
    status: Status.complete,
  },
]

export default stones

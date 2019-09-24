import { celoFirst } from './EventHelpers'

const example = [
  {
    name: 'Designers & Geeks',
    link: 'https://designersandgeeks.com/events/ux-research-design',
    celoHosted: false,
    celoSpeaking: true,
    description: undefined,
    location: 'San Francisco, California',
    startDate: '2019-10-03',
    endDate: undefined,
  },
  {
    name: 'Women in Crypto Open Mic with Coinbase',
    link: 'https://coinbasegracehopper2019.splashthat.com/',
    celoHosted: true,
    celoSpeaking: true,
    description: undefined,
    location: 'Orlando, Florida',
    startDate: '2019-10-02',
    endDate: undefined,
  },
  {
    name: 'SF Blockchain Meetup with Oasis Labs, Celo, Harmony, and Blockdaemon',
    link:
      'https://www.eventbrite.com/e/sf-blockchain-meetup-with-oasis-labs-celo-and-blockdaemon-tickets-72551965883',
    celoHosted: false,
    celoSpeaking: true,
    description: undefined,
    location: 'San Francisco, California',
    startDate: '2019-10-02',
    endDate: undefined,
  },
  {
    name: 'IAMTN Global Summit 2019: Cross Boarder Payments',
    link:
      'https://www.iamtn.org/amp/stablecoins-a-safer-bet-for-cross-border-payments-and-remittances',
    celoHosted: false,
    celoSpeaking: true,
    description: undefined,
    location: 'London, England',
    startDate: '2019-10-02',
    endDate: '2019-10-03',
  },
  {
    name: 'Grace Hopper',
    link: 'https://ghc.anitab.org/',
    celoHosted: false,
    celoSpeaking: true,
    description: undefined,
    location: 'Orlando, Florida',
    startDate: '2019-10-01',
    endDate: '2019-10-04',
  },
  {
    name: 'Stories From Mexico: The entrepreneurial spirit & need for opportunity',
    link: 'https://www.meetup.com/blockchainforsocialimpactsf/events/264197099/',
    celoHosted: true,
    celoSpeaking: true,
    description: undefined,
    location: 'San Francisco, California',
    startDate: '2019-09-26',
    endDate: undefined,
  },
  {
    name: 'University of Waterloo Career Fair',
    link: 'https://uwaterloo.ca/hire/p4e-career-fair-job-fair',
    celoHosted: false,
    celoSpeaking: true,
    description: undefined,
    location: 'Ontario, Canada',
    startDate: '2019-09-25',
    endDate: undefined,
  },
  {
    name: 'UX for Non-Designers',
    link: 'cryptosprings.org',
    celoHosted: false,
    celoSpeaking: true,
    description: 'A facilitated conversation ',
    location: 'Palm Springs, California',
    startDate: '2019-09-24',
    endDate: undefined,
  },
]

describe('celoFirst', () => {
  it('places the closest event which is celo hosted first', () => {
    expect(
      example
        .slice(0)
        .sort(celoFirst)
        .map(simplify)
    ).toEqual(RESULT)
  })
})

function simplify({ name, startDate, celoHosted }) {
  return { name, startDate, celoHosted }
}

const RESULT = [
  {
    celoHosted: true,

    name: 'Stories From Mexico: The entrepreneurial spirit & need for opportunity',

    startDate: '2019-09-26',
  },
  {
    celoHosted: true,

    name: 'Women in Crypto Open Mic with Coinbase',

    startDate: '2019-10-02',
  },
  {
    celoHosted: false,

    name: 'Designers & Geeks',

    startDate: '2019-10-03',
  },
  {
    celoHosted: false,

    name: 'SF Blockchain Meetup with Oasis Labs, Celo, Harmony, and Blockdaemon',

    startDate: '2019-10-02',
  },
  {
    celoHosted: false,

    name: 'IAMTN Global Summit 2019: Cross Boarder Payments',

    startDate: '2019-10-02',
  },
  {
    celoHosted: false,

    name: 'Grace Hopper',

    startDate: '2019-10-01',
  },
  {
    celoHosted: false,

    name: 'University of Waterloo Career Fair',

    startDate: '2019-09-25',
  },
  {
    celoHosted: false,

    name: 'UX for Non-Designers',

    startDate: '2019-09-24',
  },
]

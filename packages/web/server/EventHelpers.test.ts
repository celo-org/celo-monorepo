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
    name: 'Stories From Mexico: The entrepreneurial spirit & need for opportunity',
    link: 'https://www.meetup.com/blockchainforsocialimpactsf/events/264197099/',
    celoHosted: true,
    celoSpeaking: true,
    description: undefined,
    location: 'San Francisco, California',
    startDate: '2019-09-26',
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
    name: 'IAMTN Global Summit 2019: Cross Boarder Payments',
    startDate: '2019-10-02',
  },
]

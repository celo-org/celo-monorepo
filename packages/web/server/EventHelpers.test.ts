import { celoFirst, normalizeEvents, RawAirTableEvent } from './EventHelpers'

describe('normalizeEvents', () => {
  it('blah', () => {
    const input: RawAirTableEvent[] = [
      {
        Title: 'Testing events',
        'Notes / Run Of Show': 'SomeNotes',
        Photos: {},
        Process: 'Complete' as 'Complete',
        Organizer: [],
        'Event Link': 'celo.org/events',
        'Start Date': '2019-10-01',
        'Recap Individual': {
          id: '1',
          email: 'fake@example.com',
          name: 'Fake',
        },
        'Social Media': [],
        'Social Media Links': '',
        'Location (Format: City, Country)': 'San Francisco, California',
        'Celo Team Member Speaking?': false,
        'Description of Event': 'A great event',
      },
    ]

    const expectation = [
      {
        celoHosted: false,
        celoSpeaking: false,
        description: 'A great event',
        endDate: undefined,
        link: 'celo.org/events',
        location: 'San Francisco, California',
        name: 'Testing events',
        startDate: '2019-10-01',
      },
    ]
    expect(normalizeEvents(input)).toEqual(expectation)
  })
})

describe('celoFirst', () => {
  it('places the closest event which is celo hosted first', () => {
    expect(
      example
        .slice(0)
        .sort(celoFirst)
        .map(simplify)
    ).toEqual(RESULT)
  })

  function simplify({ name, startDate, celoHosted }) {
    return { name, startDate, celoHosted }
  }

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
})

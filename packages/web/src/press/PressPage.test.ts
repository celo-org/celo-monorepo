import { groupByMonth } from 'src/press/PressPage'
const TEST_DATA = [
  {
    date: '2020-07-31',
    title: 'Money Rising',
    publication: 'The Times',
    link: 'https://www.times.net',
  },
  {
    date: '2020-07-15',
    title: 'Practicing Humanistic Economics',
    publication: 'The Union',
    link: 'https://www.union.net',
  },
  {
    date: '2020-06-05',
    title: 'Crypto Watchlist',
    publication: 'The Daily Miner',
    link: 'https://www.daily.net',
  },
  {
    date: '2019-06-02',
    title: 'Hyperlocal Community Currency',
    publication: 'City Free Press',
    link: 'https://www.cfp.net',
  },
]

describe('groupByMonth', () => {
  it('groups entries by month when passed as function to reduce', () => {
    expect(TEST_DATA.reduce(groupByMonth, {})).toEqual({
      '2020-07-15': [
        {
          date: '2020-07-31',
          title: 'Money Rising',
          publication: 'The Times',
          link: 'https://www.times.net',
        },
        {
          date: '2020-07-15',
          title: 'Practicing Humanistic Economics',
          publication: 'The Union',
          link: 'https://www.union.net',
        },
      ],
      '2020-06-15': [
        {
          date: '2020-06-05',
          title: 'Crypto Watchlist',
          publication: 'The Daily Miner',
          link: 'https://www.daily.net',
        },
      ],
      '2019-06-15': [
        {
          date: '2019-06-02',
          title: 'Hyperlocal Community Currency',
          publication: 'City Free Press',
          link: 'https://www.cfp.net',
        },
      ],
    })
  })
})

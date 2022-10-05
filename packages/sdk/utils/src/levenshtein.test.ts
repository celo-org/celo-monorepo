import { levenshteinDistance } from './levenshtein'

describe('levenshteinDistance()', () => {
  const cases = [
    {
      a: '',
      b: '',
      distance: 0,
    },
    {
      a: 'foo',
      b: '',
      distance: 3,
    },
    {
      a: 'a',
      b: 'b',
      distance: 1,
    },
    {
      a: 'ab',
      b: 'ac',
      distance: 1,
    },
    {
      a: 'ac',
      b: 'bc',
      distance: 1,
    },
    {
      a: 'abc',
      b: 'axc',
      distance: 1,
    },
    {
      a: 'kitten',
      b: 'sitting',
      distance: 3,
    },
    {
      a: 'xabxcdxxefxgx',
      b: '1ab2cd34ef5g6',
      distance: 6,
    },
    {
      a: 'cat',
      b: 'cow',
      distance: 2,
    },
    {
      a: 'xabxcdxxefxgx',
      b: 'abcdefg',
      distance: 6,
    },
    {
      a: 'javawasneat',
      b: 'scalaisgreat',
      distance: 7,
    },
    {
      a: 'example',
      b: 'samples',
      distance: 3,
    },
    {
      a: 'sturgeon',
      b: 'urgently',
      distance: 6,
    },
    {
      a: 'levenshtein',
      b: 'frankenstein',
      distance: 6,
    },
    {
      a: 'distance',
      b: 'difference',
      distance: 5,
    },
    {
      a: '因為我是中國人所以我會說中文',
      b: '因為我是英國人所以我會說英文',
      distance: 2,
    },
  ]

  for (const { a, b, distance } of cases) {
    it(`should report a distance of ${distance} between '${a}' and '${b}'`, () => {
      expect(levenshteinDistance(a, b)).toBe(distance)
    })
  }
})

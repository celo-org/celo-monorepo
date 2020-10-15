import { render } from '@testing-library/react'
import * as React from 'react'
import { Props as Item } from './DirectoryItem'
import DirectorySection from './DirectorySection'

it('renders a collection of Grant Recipients', () => {
  const items: Item[] = [
    {
      name: 'Jest',
      headline: 'Testing the future',
      description: 'Something like this',
      website: 'https://www.example.test',
      repo: 'github.com/celo-org/celo-monorepo',
      logo: 'image.gif',
      logoWidth: 300,
      logoHeight: 200,
    },
  ]
  const { getByText } = render(
    <DirectorySection
      name={'Test and Go'}
      description="Projects that test the bounds"
      items={items}
    />
  )
  expect(getByText('Test and Go')).toBeVisible()
  expect(getByText('Projects that test the bounds')).toBeVisible()
  expect(getByText('Testing the future')).toBeVisible()
  expect(getByText('Jest')).toBeVisible()
  expect(getByText('Something like this')).toBeVisible()
})

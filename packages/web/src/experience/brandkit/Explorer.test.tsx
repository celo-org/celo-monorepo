import { waitFor } from '@testing-library/dom'
import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { TestProvider } from 'src/_page-tests/test-utils'
import Explorer from './Explorer'

const ICONS = [
  {
    name: 'star',
    description: 'Stellar Clouds',
    preview: 'star.jpg',
    uri: 'star.jpg',
    tags: ['sun', 'space'],
    id: '1',
  },
  {
    name: 'Stellar Nebula',
    description: 'Vast ethereal clouds',
    preview: 'nebular.jpg',
    uri: 'nebular.jpg',
    tags: ['sun', 'space'],
    id: '1asd',
  },
  {
    name: 'Orion',
    description: 'constellations',
    preview: 'constellations.jpg',
    uri: 'constellations.jpg',
    tags: ['Stellar', 'space'],
    id: '100',
  },
  {
    name: 'Tree',
    description: 'large Plant',
    preview: 'tree.jpg',
    uri: 'tree.jpg',
    tags: ['forest', 'green', 'life'],
    id: '2',
  },
  {
    name: 'human',
    description: 'homo sapien',
    preview: 'human.jpg',
    uri: 'human.jpg',
    tags: ['person', 'life'],
    id: '3',
  },
  {
    name: 'flower',
    description: 'petals',
    preview: 'flower.jpg',
    uri: 'flower.jpg',
    tags: ['plant', 'life'],
    id: '4',
  },
]

describe(Explorer, () => {
  describe('when typing in search box', () => {
    function search() {
      const options = render(
        <TestProvider>
          <Explorer icons={ICONS} />
        </TestProvider>
      )
      const { getByLabelText } = options
      fireEvent.change(getByLabelText('search'), { target: { value: 'Stellar' } })
      return options
    }
    it('shows number of icons found', async () => {
      const { container, getByText } = search()
      await waitFor(
        () => {
          expect(getByText('3 Matching Icons')).toBeVisible()
        },
        { container }
      )
    })

    it('hides non matching icons', async () => {
      const { container, getByText } = search()
      await waitFor(
        () => {
          expect(getByText('human')).not.toBeVisible()
          expect(getByText('petals')).not.toBeVisible()
          expect(getByText('Tree')).not.toBeVisible()
        },
        { container }
      )
    })

    // There are issues with react reveal + toBeVisible
    // If you comment out the <Fade> element, these tests pass

    it.skip('finds by description', async () => {
      const { container, getByText } = search()
      await waitFor(
        () => {
          expect(getByText('star')).toBeVisible()
        },
        { container, timeout: 2000 }
      )
    })

    it.skip('finds by name', async () => {
      const { container, getByText } = search()
      await waitFor(
        () => {
          expect(getByText('Stellar Nebula')).toBeVisible()
        },
        { container }
      )
    })

    it.skip('finds by tag', async () => {
      const { container, getByText } = search()
      await waitFor(
        () => {
          expect(getByText('Orion')).toBeVisible()
        },
        { container }
      )
    })
  })
})

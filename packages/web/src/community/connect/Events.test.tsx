import { render } from '@testing-library/react'
import { EventProps } from 'fullstack/EventProps'
import * as React from 'react'
import { TestProvider } from 'src/_page-tests/test-utils'
import Events from 'src/community/connect/Events'

describe('Events', () => {
  describe('when pastEvents NOT given', () => {
    it('a button to view past events is shown', () => {
      const { getByText } = render(
        <TestProvider>
          <Events pastEvents={null} />
        </TestProvider>
      )

      expect(getByText('Past Events').getAttribute('href')).toEqual('/past-events')
    })
  })
  describe('when past Events are given', () => {
    const pastEvents: EventProps[] = [
      {
        name: 'Legos: crypto for kids!',
        celoSpeaking: true,
        celoHosted: true,
        startDate: '2030-04-04',
        location: 'Cambridge, MA',
      },
    ]
    it('doesnt have a button to see events', () => {
      const { getByText } = render(
        <TestProvider>
          <Events pastEvents={pastEvents} />
        </TestProvider>
      )

      expect(getByText('Past Events').getAttribute('href')).toBeNull()
    })
  })
  describe('when upcoming Events are given', () => {
    const upcomingEvents: EventProps[] = [
      {
        name: 'The First 1 Trillion USD Crypto Market',
        celoSpeaking: false,
        celoHosted: true,
        startDate: '2030-05-04',
        location: 'NewCastle, NSW',
      },
      {
        name: 'Two Chains: A conversation on crypto and hip hop',
        celoSpeaking: false,
        celoHosted: false,
        startDate: '2030-06-04',
        location: 'Paris, TX',
      },
      {
        name: 'Gifts and Economies',
        celoSpeaking: true,
        celoHosted: false,
        startDate: '2030-07-04',
        location: 'York, England',
      },
    ]
    it('shows the event details', () => {
      const { getByText } = render(
        <TestProvider>
          <Events upcomingEvents={upcomingEvents} />
        </TestProvider>
      )
      expect(getByText('Gifts and Economies')).toBeTruthy()
      expect(getByText('Speaking')).toBeTruthy()
    })
  })

  describe('when it is loading', () => {
    it('A Loading graphic is displayed', () => {
      const { getByLabelText } = render(
        <TestProvider>
          <Events loading={true} />
        </TestProvider>
      )

      expect(getByLabelText('loading')).toBeTruthy()
    })
  })
  describe('when no events are given and it is not loading', () => {
    it('it says there are no events found', () => {
      const { getByText } = render(
        <TestProvider>
          <Events loading={false} />
        </TestProvider>
      )

      expect(getByText(/no events/)).toBeTruthy()
    })
  })
})

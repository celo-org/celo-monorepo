import fetch from 'cross-fetch'
import * as React from 'react'
import Events from 'src/events/Events'

export async function getEvents() {
  const res = await fetch('/proxy/events', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
  return res.json()
}

interface Props {
  limitedPreview: boolean
}

export default class EventData extends React.PureComponent<Props> {
  state = { upcomingEvents: [], topEvent: null, loaded: false }

  componentDidMount = async () => {
    const { upcomingEvents, topEvent } = await getEvents()
    this.setState({ upcomingEvents, topEvent, loaded: true })
  }

  render() {
    const state = this.state

    return (
      <Events
        limitedPreview={this.props.limitedPreview}
        upcomingEvents={state.upcomingEvents}
        topEvent={state.topEvent}
        loading={!state.loaded}
      />
    )
  }
}

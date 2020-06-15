import { EventProps } from 'fullstack/EventProps'
import * as React from 'react'
import { View } from 'react-native'
import Events from 'src/community/connect/Events'
import { getEvents } from 'src/community/connect/EventsData'
import OpenGraph from 'src/header/OpenGraph'
import { NameSpaces } from 'src/i18n'
import { standardStyles } from 'src/styles'

const preview = require('src/community/connect/preview.jpg')

interface State {
  pastEvents: EventProps[]
  loading: boolean
}

export default class PastEventsPage extends React.PureComponent<{}, State> {
  static getInitialProps() {
    return { namespacesRequired: [NameSpaces.common, NameSpaces.community] }
  }

  state = {
    loading: true,
    pastEvents: [],
  }

  async componentDidMount() {
    const { pastEvents } = await getEvents()
    this.setState({ pastEvents, loading: false })
  }

  render() {
    return (
      <View style={standardStyles.sectionMargin}>
        <OpenGraph
          path="/past-events"
          title={'Past Celo Events'}
          description="List of past Celo community events around the world. Join the conversation and our community. Diverse perspectives and inclusive conversations welcomed."
          image={preview}
        />
        <Events pastEvents={this.state.pastEvents} loading={this.state.loading} />
      </View>
    )
  }
}

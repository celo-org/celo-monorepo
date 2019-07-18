import * as React from 'react'
import { View } from 'react-native'
import OpenGraph from 'src/header/OpenGraph'

import Events from 'src/community/connect/Events'
import {
  EventProps,
  intializeTableTop,
  normalizeEvents,
  splitEvents,
} from 'src/community/EventHelpers'
import { standardStyles } from 'src/styles'
const preview = require('src/community/connect/preview.jpg')

interface Props {
  pastEvents: EventProps[]
}

export default class PastEventsPage extends React.PureComponent<Props> {
  static async getInitialProps() {
    let data
    try {
      data = await intializeTableTop()
    } catch {
      data = []
    }
    const { pastEvents } = splitEvents(normalizeEvents(data))
    return { pastEvents, namespacesRequired: ['common', 'community'] }
  }

  render() {
    return (
      <View style={standardStyles.sectionMargin}>
        <OpenGraph
          path="/past-events"
          title={'Past Celo Events'}
          description={
            'Celo is building a monetary system that allows more people to participate, and we invite you to join the conversation and our community. Diverse perspectives and inclusive conversations welcomed.'
          }
          image={preview}
        />
        <Events pastEvents={this.props.pastEvents} />
      </View>
    )
  }
}

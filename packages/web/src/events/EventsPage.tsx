import { View } from 'react-native'
import ConnectionFooter from 'src/shared/ConnectionFooter'
import EventsData from 'src/events/EventsData'

export default function EventsPage() {
  return (
    <View>
      <EventsData />
      <ConnectionFooter />
    </View>
  )
}

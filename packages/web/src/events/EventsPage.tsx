import { View } from 'react-native'
import EventsData from 'src/events/EventsData'
import ConnectionFooter from 'src/shared/ConnectionFooter'

export default function EventsPage() {
  return (
    <View>
      <EventsData limitedPreview={false} />
      <ConnectionFooter />
    </View>
  )
}

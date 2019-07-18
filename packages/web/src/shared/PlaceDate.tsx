import fecha from 'fecha'
import { StyleSheet, Text } from 'react-native'
import { Colors, TextStyles } from 'src/shared/Styles'

export function printDuration(date: Date, endDate: Date | null): string {
  try {
    if (endDate) {
      return `${fecha.format(date, 'MMM D')}-${fecha.format(endDate, 'mediumDate')}`
    }
    return fecha.format(date, 'mediumDate')
  } catch (e) {
    return ''
  }
}

export default function PlaceDate({
  location = '',
  startDate,
  endDate,
}: {
  location: string
  startDate: Date
  endDate?: Date
}) {
  const date = printDuration(startDate, endDate)

  return <Text style={[TextStyles.smallMain, styles.text]}>{`${location} — ${date}`}</Text>
}

const styles = StyleSheet.create({
  text: {
    color: Colors.DARK_GRAY,
  },
})

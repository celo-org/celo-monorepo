import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import DirectoryItem, { Props as DirectoryItemProps } from 'src/experience/grants/DirectoryItem'
import { H4 } from 'src/fonts/Fonts'
import { colors, fonts, standardStyles } from 'src/styles'

interface Props {
  name: string
  description: string
  items: DirectoryItemProps[]
}

export default function DirectorySection({ name, items, description }: Props) {
  return (
    <View style={styles.root}>
      <H4>{name}</H4>
      <View style={styles.line} />
      <Text style={[fonts.p, standardStyles.elementalMargin]}>{description}</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <DirectoryItem key={item.name} {...item} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {},
  grid: {
    display: 'grid',
    gridRowGap: 55,
    gridColumnGap: 40,
    gridTemplateColumns: `repeat(3, 1fr)`,
  },
  line: {
    height: 1,
    backgroundColor: colors.gray,
    marginTop: 10,
  },
})

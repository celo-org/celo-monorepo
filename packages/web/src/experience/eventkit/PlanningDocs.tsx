import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import placeholder from 'src/experience/eventkit/content/tenents/striving-for-beauty.png'
import External from 'src/icons/External'
import AspectRatio from 'src/shared/AspectRatio'
import { colors, fonts, standardStyles } from 'src/styles'

function DocPreview({ source, href, title }) {
  return (
    <View style={styles.root}>
      <a href={href}>
        <AspectRatio ratio={148 / 111} style={styles.image}>
          <Image source={source} style={standardStyles.image} />
        </AspectRatio>
      </a>
      <a href={href}>
        <Text style={fonts.h6}>
          {title} <External size={14} color={colors.dark} />
        </Text>
      </a>
    </View>
  )
}

const DOCS = [
  {
    source: placeholder,
    href: '#',
    title: 'Types of Events',
  },
  {
    source: placeholder,
    href: '#',
    title: 'Types of Events',
  },
  {
    source: placeholder,
    href: '#',
    title: 'Types of Events',
  },
  {
    source: placeholder,
    href: '#',
    title: 'Types of Events',
  },
  {
    source: placeholder,
    href: '#',
    title: 'Types of Events',
  },
  {
    source: placeholder,
    href: '#',
    title: 'Types of Events',
  },
  {
    source: placeholder,
    href: '#',
    title: 'Types of Events',
  },
  {
    source: placeholder,
    href: '#',
    title: 'Types of Events',
  },
]

export default function PlanningDocs() {
  return (
    <View style={styles.grid}>
      {DOCS.map((doc) => {
        return <DocPreview key={doc.title} source={doc.source} href={doc.href} title={doc.title} />
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    display: 'grid',
    gridGap: 15,
    gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`,
    justifyContent: 'space-between',
  },
  root: { flexBasis: 160, marginVertical: 10 },
  image: {
    width: '90%',
    marginBottom: 10,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray,
  },
})

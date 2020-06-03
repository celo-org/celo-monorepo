import * as React from 'react'
import { useAsync } from 'react-async-hook'
import { Image, StyleSheet, Text, View } from 'react-native'
import { trackDownload, Types } from 'src/experience/eventkit/tracking'
import External from 'src/icons/External'
import AspectRatio from 'src/shared/AspectRatio'
import { colors, fonts, standardStyles } from 'src/styles'

interface Doc {
  title: string
  preview: any
  uri: string
}

// usually if there is an icon it will jump to the next line by its lonely self, instead we marry it to the last word so that it has a partner
const MarryLastWordToIcon = React.memo(function _MarryLastWordToIcon({ words }: { words: string }) {
  const titleParts = words.split(' ')
  const titleEnd = (
    <Text style={styles.noBreaks}>
      {titleParts[titleParts.length - 1]} <External size={14} color={colors.dark} />
    </Text>
  )

  return (
    <>
      {titleParts.splice(0, titleParts.length - 1).join(' ')} {titleEnd}
    </>
  )
})

function DocPreview({ preview, uri, title }: Doc) {
  const track = React.useCallback(() => trackDownload({ name: title, type: Types.PlanningDoc }), [
    title,
  ])

  return (
    <View style={styles.root}>
      <a href={uri} target={'_blank'} onClick={track}>
        <AspectRatio ratio={148 / 111} style={styles.image}>
          <Image source={preview} style={standardStyles.image} />
        </AspectRatio>
      </a>
      <a href={uri} target={'_blank'} onClick={track}>
        <Text style={fonts.h6}>
          <MarryLastWordToIcon words={title} />
        </Text>
      </a>
    </View>
  )
}

async function fetchDocs() {
  return (await fetch('/api/experience/assets/planning')).json()
}

export default function PlanningDocs() {
  const planningDocs = useAsync<Doc[]>(fetchDocs, [])

  if (!planningDocs.result) {
    return <View style={styles.placeholder} />
  }

  if (planningDocs.result) {
    return (
      <View style={styles.grid}>
        {planningDocs.result.map((doc) => {
          return (
            <DocPreview key={doc.title} preview={doc.preview} uri={doc.uri} title={doc.title} />
          )
        })}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  grid: {
    display: 'grid',
    gridColumnGap: 20,
    gridRowGap: 10,
    gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`,
    justifyContent: 'space-between',
  },
  root: { flexBasis: 160, marginVertical: 10 },
  image: {
    width: '100%',
    marginBottom: 10,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray,
  },
  placeholder: {
    minHeight: 300,
  },
  noBreaks: {
    display: 'inline-flex',
  },
})

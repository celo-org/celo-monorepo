import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { contentPadding } = variables

interface Props {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
  reviewCTA: CTA
  onPress?: () => unknown
}

export interface CTA {
  onPress: () => unknown
  text: string
}

function Wrapper({ onPress, children }: { children: React.ReactNode; onPress?: () => unknown }) {
  return onPress ? (
    <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
  ) : (
    <View>{children}</View>
  )
}

export default function SummaryNotification({ icon, title, children, reviewCTA, onPress }: Props) {
  return (
    <Wrapper onPress={onPress}>
      <View style={[styles.container, elevationShadowStyle(2)]}>
        {icon && <View style={styles.iconArea}>{icon}</View>}
        <View style={styles.contentArea}>
          <Text style={fontStyles.bodySmallBold}>{title}</Text>
          <View style={styles.body}>
            {children}
            <View style={styles.ctas}>
              <TextButton style={styles.action} onPress={reviewCTA.onPress}>
                {reviewCTA.text}
              </TextButton>
            </View>
          </View>
        </View>
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  ctas: {
    flexDirection: 'row',
    marginTop: 5,
  },
  action: {
    paddingEnd: 15,
  },
  body: {
    minHeight: 60,
    justifyContent: 'space-between',
  },
  container: {
    padding: contentPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.light,
  },
  iconArea: {
    paddingRight: contentPadding,
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentArea: {
    justifyContent: 'space-between',
    flex: 1,
  },
})

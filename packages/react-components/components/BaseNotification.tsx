import TextButton from '@celo/react-components/components/TextButton'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const { contentPadding } = variables

interface Props {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
  ctas: CTA[]
  onPress?: () => unknown
}

export interface CTA {
  onPress: () => unknown
  text: string
}

function Wrapper({ onPress, children }: { children: React.ReactNode; onPress?: () => unknown }) {
  return onPress ? <Touchable onPress={onPress}>{children}</Touchable> : <View>{children}</View>
}

export default function BaseNotification({ icon, title, children, ctas, onPress }: Props) {
  return (
    <Wrapper onPress={onPress}>
      <View style={[styles.container, elevationShadowStyle(2)]}>
        {icon && <View style={styles.iconArea}>{icon}</View>}
        <View style={styles.contentArea}>
          <Text style={fontStyles.bodySmallSecondary}>{title}</Text>
          <View style={styles.body}>
            {children}
            <View style={styles.ctas}>
              {ctas.map((cta, j) => (
                <TextButton key={j} style={styles.action} onPress={cta.onPress}>
                  {cta.text}
                </TextButton>
              ))}
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
    paddingTop: 8,
    minHeight: 60,
    justifyContent: 'space-between',
  },
  container: {
    padding: contentPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.background,
  },
  iconArea: {
    paddingRight: contentPadding,
    alignItems: 'center',
  },
  contentArea: {
    justifyContent: 'space-between',
    flex: 1,
  },
})

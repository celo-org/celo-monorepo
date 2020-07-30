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
  title: string | React.ReactNode
  children: React.ReactNode
  ctas: CTA[]
  onPress?: () => unknown
  testID?: string
}

export interface CTA {
  onPress: () => unknown
  text: string
}

function Wrapper({ onPress, children }: { children: React.ReactNode; onPress?: () => unknown }) {
  return onPress ? (
    <Touchable style={styles.wrapper} onPress={onPress}>
      {children}
    </Touchable>
  ) : (
    <View style={styles.wrapper}>{children}</View>
  )
}

export default function BaseNotification({ icon, title, children, ctas, onPress, testID }: Props) {
  return (
    <View style={[styles.container, elevationShadowStyle(2)]}>
      <Wrapper onPress={onPress}>
        <View style={styles.innerContainer}>
          {icon && <View style={styles.iconArea}>{icon}</View>}
          <View style={styles.contentArea}>
            <Text style={fontStyles.bodySmallSemiBold} testID={testID && `${testID}/Title`}>
              {title}
            </Text>
            <View style={styles.body}>
              {children}
              <View style={styles.ctas}>
                {ctas.map((cta, j) => (
                  <TextButton
                    testID={`${testID}/${cta.text}/Button`}
                    key={j}
                    style={styles.action}
                    onPress={cta.onPress}
                  >
                    {cta.text}
                  </TextButton>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Wrapper>
    </View>
  )
}

const styles = StyleSheet.create({
  ctas: {
    flexDirection: 'row',
    marginTop: 12,
  },
  action: {
    paddingEnd: 15,
  },
  body: {
    paddingTop: 2,
    minHeight: 60,
    justifyContent: 'space-between',
  },
  container: {
    width: '100%',
    backgroundColor: colors.background,
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wrapper: {
    padding: contentPadding,
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

// Deprecated
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Link from 'src/shared/Link'
import { Colors, TextStyles } from 'src/shared/Styles'

interface Props {
  text: string
  href: string
}

export default function Button({ text, href }: Props) {
  return (
    <Link href={href}>
      <View style={styles.button}>
        <Text accessibilityRole="link" tabIndex={0} style={[TextStyles.button, styles.buttonText]}>
          {text}
        </Text>
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 45,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: 3,
  },
  buttonText: {
    color: Colors.WHITE,
    textAlign: 'center',
  },
})

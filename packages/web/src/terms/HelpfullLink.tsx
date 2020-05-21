import * as React from 'react'
import { StyleSheet } from 'react-native'
import Button, { BTN, SIZE } from 'src/shared/Button.3'

export function HelpfullLink({ text, href }) {
  return (
    <Button
      kind={BTN.NAKED}
      style={styles.link}
      text={text}
      href={href}
      size={SIZE.normal}
      target="_blank"
    />
  )
}

const styles = StyleSheet.create({
  link: {
    marginTop: 10,
    marginRight: 30,
  },
})

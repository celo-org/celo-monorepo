import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Button, { BTN } from 'src/shared/Button.3'
import { fonts, standardStyles } from 'src/styles'

interface Link {
  name: string
  link: string
  icon?: React.ReactNode
}

interface Props {
  heading: string
  links: Link[]
}

export default function FooterColumn({ heading, links }: Props) {
  return (
    <View style={styles.root}>
      <Text style={[fonts.h6, standardStyles.elementalMarginBottom]}>{heading}</Text>
      {links.map(({ name, link, icon }) => (
        <View style={styles.linkContainer} key={link}>
          <Button
            target="_blank"
            iconLeft={icon}
            kind={BTN.INLINE}
            text={name}
            href={link}
            style={linkStyle}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 30,
  },
  link: {
    textDecorationLine: 'none',
  },
  linkContainer: {
    marginVertical: 8,
  },
})

const linkStyle = [styles.link, fonts.legal]

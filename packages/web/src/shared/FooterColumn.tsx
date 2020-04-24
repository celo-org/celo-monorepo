import * as React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { useScreenSize } from 'src/layout/ScreenSize'
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
  style?: ViewStyle | ViewStyle[]
}

export default React.memo(function FooterColumn({ heading, links, style }: Props) {
  const { isMobile } = useScreenSize()
  return (
    <View style={[isMobile ? styles.rootMobile : styles.root, style]}>
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
})

const styles = StyleSheet.create({
  rootMobile: {
    marginTop: 35,
    width: '50%',
    paddingHorizontal: 10,
  },
  root: {
    paddingHorizontal: 25,
  },
  link: {
    textDecorationLine: 'none',
  },
  linkContainer: {
    marginVertical: 8,
  },
})

const linkStyle = [styles.link, fonts.legal]

import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import { TextStyles } from 'src/shared/Styles'

interface Props {
  color: string
}

const LangSwitcher = (props: Props & I18nProps) => {
  const switchLang = (lng: string) => {
    props.i18n.changeLanguage(lng)
  }

  const switchEn = () => {
    switchLang('en')
  }

  const switchEs = () => {
    switchLang('es')
  }

  const switchDe = () => {
    switchLang('de')
  }

  const switchZh = () => {
    switchLang('zh')
  }

  const color = { color: props.color }
  const textStyle = [TextStyles.small, color]
  const spacer = [TextStyles.small, styles.langSpacer, color]

  return (
    <View style={styles.langSwitcher}>
      <View style={styles.langHover} onClick={switchEn}>
        <Text style={textStyle}>EN</Text>
      </View>
      <Text style={spacer}>|</Text>
      <View style={styles.langHover} onClick={switchEs}>
        <Text style={textStyle}>ES</Text>
      </View>
      <Text style={spacer}>|</Text>
      <View style={styles.langHover} onClick={switchDe}>
        <Text style={textStyle}>DE</Text>
      </View>
      <Text style={spacer}>|</Text>
      <View style={styles.langHover} onClick={switchZh}>
        <Text style={textStyle}>中文</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  langHover: {
    cursor: 'pointer',
  },
  langSwitcher: {
    flexDirection: 'row',
  },
  langSpacer: {
    marginHorizontal: 10,
  },
})

export default withNamespaces('common')(LangSwitcher)

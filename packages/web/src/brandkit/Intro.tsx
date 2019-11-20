import * as React from 'react'
import { withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import { GAP } from 'src/brandkit/common/constants'
import Page from 'src/brandkit/common/Page'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps } from 'src/i18n'

export default React.memo(function Intro() {
  return (
    <Page
      sections={[
        {
          id: 'overview',
          children: <Overview />,
        },
      ]}
    />
  )
})

const Overview = withNamespaces()(function _Overview({ t }: I18nProps) {
  return (
    <View style={styles.container}>
      <H1>{t('home.title')}</H1>
      <H4>{t('home.introduction')}</H4>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { paddingHorizontal: GAP },
})

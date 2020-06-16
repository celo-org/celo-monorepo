import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { brandStyles } from 'src/experience/common/constants'
import { H1, H2, H3, H4 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { fonts, standardStyles } from 'src/styles'

type Props = I18nProps

export default withNamespaces(NameSpaces.brand)(
  React.memo(function UseageExamples({ t }: Props) {
    return (
      <View style={brandStyles.gap}>
        <Text style={[fonts.h5, standardStyles.elementalMarginBottom]}>
          {t('typography.examplesTitle')}
        </Text>
        <View style={[brandStyles.fullBorder, styles.box]}>
          <H1 style={styles.bigMargin}>{t('typography.h1Example')}</H1>
          <H2 style={styles.bigMargin}>{t('typography.h2Example')}</H2>
          <H3 style={styles.bigMargin}>{t('typography.h3Example')}</H3>
          <H4 style={styles.bigMargin}>{t('typography.h4Example')}</H4>
          <Text style={[fonts.h5, styles.modestMargin]}>{t('typography.h5Example')}</Text>
          <Text style={[fonts.p, styles.bigMargin]}>{t('typography.bodyExample')}</Text>
          <Text style={[fonts.h6, styles.modestMargin]}>{t('typography.h5Example')}</Text>
          <Text style={fonts.legal}>{t('typography.smallExample')}</Text>
        </View>
      </View>
    )
  })
)

const styles = StyleSheet.create({
  bigMargin: {
    marginBottom: 48,
  },
  modestMargin: {
    marginBottom: 12,
  },
  box: {
    padding: 30,
  },
  col: {
    flexDirection: 'column-reverse',
    justifyContent: 'flex-end',
  },
})

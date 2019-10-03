import * as React from 'react'
import { View, Text } from 'react-native'
import FellowCover from 'src/fellowship/FellowCover'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import BookLayout from 'src/layout/BookLayout'
import { I18nProps, withNamespaces, NameSpaces } from 'src/i18n'
import { fonts } from 'src/styles'
import FellowshipForm from 'src/fellowship/FellowshipForm'
import FellowViewer from 'src/fellowship/FellowViewer'
import ConnectionFooter from 'src/shared/ConnectionFooter'

function FellowshipPage({ t }: I18nProps) {
  return (
    <View style={{ marginTop: HEADER_HEIGHT }}>
      <FellowCover />
      <BookLayout label={t('fellowsLabel')}>
        <Text style={fonts.p}>{t('fellowsText')}</Text>
      </BookLayout>
      <FellowViewer />
      <BookLayout label={t('formLabel')}>
        <FellowshipForm />
      </BookLayout>
      <ConnectionFooter />
    </View>
  )
}

export default withNamespaces(NameSpaces.fellowship)(FellowshipPage)

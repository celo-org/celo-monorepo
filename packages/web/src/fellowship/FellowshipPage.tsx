import * as React from 'react'
import { Text, View } from 'react-native'
import FellowCover from 'src/fellowship/FellowCover'
import FellowshipForm from 'src/fellowship/FellowshipForm'
import FellowViewer from 'src/fellowship/FellowViewer'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import BookLayout from 'src/layout/BookLayout'
import ConnectionFooter from 'src/shared/ConnectionFooter'
import { HEADER_HEIGHT } from 'src/shared/Styles'

function FellowshipPage({ t }: I18nProps) {
  return (
    <View style={{ marginTop: HEADER_HEIGHT }}>
      <FellowCover />
      <FellowViewer />
      <BookLayout label={t('formLabel')}>
        <FellowshipForm />
      </BookLayout>
      <ConnectionFooter />
    </View>
  )
}

export default withNamespaces(NameSpaces.fellowship)(FellowshipPage)

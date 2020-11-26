import ContactCircle from '@celo/react-components/components/ContactCircle'
import { SettingsItemInput } from '@celo/react-components/components/SettingsItem'
import fontStyles from '@celo/react-components/styles/fonts'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { setName } from 'src/account/actions'
import { userContactDetailsSelector } from 'src/account/selectors'
import { Namespaces } from 'src/i18n'
import useSelector from 'src/redux/useSelector'

function Profile() {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { t } = useTranslation(Namespaces.accountScreen10)
  const name = useSelector((state) => state.account.name)
  const userContact = useSelector(userContactDetailsSelector)

  const onSetName = (userName: string) => {
    dispatch(setName(userName))
  }

  const onBlur = () => {
    navigation.goBack()
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView edges={['bottom']}>
        <Text style={styles.title}>{t('editProfile')}</Text>
        <View style={styles.accountProfile}>
          <ContactCircle thumbnailPath={userContact.thumbnailPath} name={name} size={80} />
        </View>
        <SettingsItemInput
          value={name ?? t('global:unknown')}
          testID="ProfileEditName"
          title={t('name')}
          placeholder={t('yourName')}
          onValueChange={onSetName}
          onBlur={onBlur}
        />
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accountProfile: {
    paddingLeft: 10,
    paddingTop: 30,
    paddingRight: 15,
    paddingBottom: 15,
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h2,
    margin: 16,
  },
})

export default Profile

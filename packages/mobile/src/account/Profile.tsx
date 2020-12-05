import { SettingsItemInput } from '@celo/react-components/components/SettingsItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import * as RNFS from 'react-native-fs'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { setName, setPicture } from 'src/account/actions'
import { nameSelector, pictureSelector } from 'src/account/selectors'
import { showMessage } from 'src/alert/actions'
import CancelButton from 'src/components/CancelButton'
import i18n, { Namespaces } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import PictureInput from 'src/onboarding/registration/PictureInput'
import { saveImageDataUrlToFile } from 'src/utils/image'

type Props = StackScreenProps<StackParamList, Screens.Profile>

function Profile({ navigation, route }: Props) {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const [newName, setNewName] = useState(useSelector(nameSelector) ?? '')
  const picturePath = useSelector(pictureSelector)
  // We are using newPictureUri to show the image until the user presses the Save button, at which
  // point we store the newPictureData on the file system and update the URI on the Redux store.
  const [newPictureUri, setNewPictureUri] = useState(picturePath)
  const [newPictureData, setNewPictureData] = useState('')

  const dispatch = useDispatch()

  useEffect(() => {
    if (route.params?.save) {
      navigation.setParams({ save: false })
      let newPicturePath = null
      if (newPictureData) {
        newPicturePath = saveImageDataUrlToFile(
          newPictureData,
          `file://${RNFS.DocumentDirectoryPath}/profile-${Date.now()}`
        )
      }
      dispatch(setName(newName))
      dispatch(setPicture(newPicturePath))
      // TODO: Save newName and newPictureData on CIP-8.
      dispatch(showMessage(t('namePictureSaved')))
      navigation.goBack()

      // Delete old proflie pictures if necessary.
      if (picturePath && picturePath !== newPictureUri) {
        RNFS.unlink(picturePath).catch()
      }
    }
  }, [route.params?.save])

  const onPictureChosen = (uri: string, pictureDataUrl: string) => {
    setNewPictureUri(uri)
    setNewPictureData(pictureDataUrl)
  }

  const updateName = (updatedName: string) => {
    setNewName(updatedName)
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView edges={['bottom']}>
        <View style={styles.accountProfile}>
          <PictureInput
            picture={newPictureUri}
            onPhotoChosen={onPictureChosen}
            backgroundColor={colors.gray3}
          />
        </View>
        <SettingsItemInput
          value={newName ?? t('global:unknown')}
          testID="ProfileEditName"
          title={t('name')}
          placeholder={t('yourName')}
          onValueChange={updateName}
        />
      </SafeAreaView>
    </ScrollView>
  )
}

Profile.navigationOptions = ({ navigation, route }: Props) => {
  const onCancel = () => {
    navigation.goBack()
  }
  const onSave = () => {
    navigation.setParams({ save: true })
  }
  return {
    ...emptyHeader,
    headerTitle: i18n.t('accountScreen10:editProfile'),
    headerLeft: () => <CancelButton onCancel={onCancel} />,
    headerRight: () => (
      <TopBarTextButton title={i18n.t('global:save')} testID="SaveButton" onPress={onSave} />
    ),
  }
}

export default Profile

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

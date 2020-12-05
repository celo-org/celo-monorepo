import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import FormInput from '@celo/react-components/components/FormInput'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import * as RNFS from 'react-native-fs'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { setName, setPicture, setPromptForno } from 'src/account/actions'
import { hideAlert, showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import PictureInput from 'src/onboarding/registration/PictureInput'
import useTypedSelector from 'src/redux/useSelector'
import { saveImageDataUrlToFile } from 'src/utils/image'

type Props = StackScreenProps<StackParamList, Screens.NameAndPicture>

function NameAndPicture({}: Props) {
  const [nameInput, setNameInput] = useState('')
  const [, /* pictureDataUrl */ setPictureDataUrl] = useState('')
  const cachedName = useTypedSelector((state) => state.account.name)
  const picture = useTypedSelector((state) => state.account.picture)
  const dispatch = useDispatch()

  const { t } = useTranslation(Namespaces.nuxNamePin1)

  const goToNextScreen = () => {
    navigate(Screens.PincodeSet)
  }

  const onPressContinue = () => {
    dispatch(hideAlert())

    const newName = nameInput.trim()

    if (cachedName === newName) {
      goToNextScreen()
      return
    }

    if (!newName) {
      dispatch(showError(ErrorMessages.MISSING_FULL_NAME))
      return
    }

    dispatch(setPromptForno(true)) // Allow forno prompt after Welcome screen
    ValoraAnalytics.track(OnboardingEvents.name_and_picture_set, {
      includesPhoto: false,
    })
    dispatch(setName(newName))

    // TODO: Store newName and pictureDataUrl on CIP-8.
    goToNextScreen()
  }

  const onPhotoChosen = (pictureUri: string, dataUrl: string) => {
    const fileName = saveImageDataUrlToFile(
      dataUrl,
      `file://${RNFS.DocumentDirectoryPath}/profile-${Date.now()}`
    )
    setPictureDataUrl(dataUrl)
    dispatch(setPicture(fileName))
  }

  return (
    <SafeAreaView style={styles.container}>
      <DevSkipButton nextScreen={Screens.PincodeSet} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always">
        <PictureInput
          picture={picture}
          onPhotoChosen={onPhotoChosen}
          backgroundColor={colors.onboardingBrownLight}
        />
        <FormInput
          label={t('fullName')}
          style={styles.name}
          onChangeText={setNameInput}
          value={nameInput}
          enablesReturnKeyAutomatically={true}
          placeholder={t('fullNamePlaceholder')}
          testID={'NameEntry'}
        />
        <Button
          onPress={onPressContinue}
          text={t('global:next')}
          size={BtnSizes.MEDIUM}
          type={BtnTypes.ONBOARDING}
          disabled={!nameInput.trim()}
          testID={'NameAndPictureContinueButton'}
        />
      </ScrollView>
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

export default NameAndPicture

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 80,
  },
  name: {
    marginTop: 24,
    marginBottom: 32,
  },
})

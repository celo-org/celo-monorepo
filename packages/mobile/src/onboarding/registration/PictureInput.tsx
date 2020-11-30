import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Platform, StyleSheet, Text } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import ImagePicker from 'react-native-image-crop-picker'
import OptionsChooser from 'src/components/OptionsChooser'
import { Namespaces } from 'src/i18n'

interface Props {
  picture: string | null
  onPhotoChosen: (photo: string) => void
  backgroundColor: string
}

function PictureInput({ picture, onPhotoChosen, backgroundColor }: Props) {
  const [showOptions, setShowOptions] = useState(false)
  const updateShowOptions = (show: boolean) => () => setShowOptions(show)

  const { t } = useTranslation(Namespaces.accountScreen10)

  const pickPhoto = async (pickerFunction: typeof ImagePicker.openPicker) => {
    try {
      const image = await pickerFunction({
        width: 200,
        height: 200,
        cropping: true,
        includeBase64: true,
        cropperCircleOverlay: true,
        cropperChooseText: t('global:choose'),
        cropperCancelText: t('global:cancel'),
      })
      onPhotoChosen(`data:${image.mime};base64,${image.data}`)
    } catch (e) {
      console.log(e)
      Logger.error('Error while fetching image from picker', e)
    }
  }

  const onOptionChosen = async (buttonIndex: number) => {
    setShowOptions(false)
    // Give time for the modal to close when using Android or the
    // picker/camera will close instantly.
    setTimeout(
      async () => {
        if (buttonIndex === 0) {
          await pickPhoto(ImagePicker.openPicker)
        } else if (buttonIndex === 1) {
          await pickPhoto(ImagePicker.openCamera)
        } else if (buttonIndex === 2) {
          onPhotoChosen('')
        }
      },
      Platform.OS === 'android' ? 500 : 0
    )
  }

  const showRemoveOption = !!picture
  return (
    <>
      <TouchableOpacity
        style={[styles.container, { backgroundColor }]}
        onPress={updateShowOptions(true)}
      >
        {picture ? (
          <Image style={styles.picture} source={{ uri: picture }} />
        ) : (
          <Text style={styles.addPhoto}>{t('addPhoto')}</Text>
        )}
      </TouchableOpacity>
      <OptionsChooser
        isVisible={showOptions}
        options={[
          t('chooseFromLibrary'),
          t('takePhoto'),
          showRemoveOption ? t('removePhoto') : '',
        ].filter((option) => option.length > 0)}
        includeCancelButton={true}
        isLastOptionDestructive={showRemoveOption}
        onOptionChosen={onOptionChosen}
        onCancel={updateShowOptions(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  picture: {
    height: 120,
    width: 120,
    borderRadius: 60,
    resizeMode: 'cover',
  },
  addPhoto: {},
})

export default PictureInput

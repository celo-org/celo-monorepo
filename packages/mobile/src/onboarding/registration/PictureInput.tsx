import colors from '@celo/react-components/styles/colors'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Platform, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import ImagePicker from 'react-native-image-crop-picker'
import OptionsChooser from 'src/components/OptionsChooser'
import { Namespaces } from 'src/i18n'
import Photo from 'src/icons/Photo'
import { getDataURL } from 'src/utils/image'
import Logger from 'src/utils/Logger'

interface Props {
  picture: string | null
  onPhotoChosen: (dataUrl: string | null) => void
  backgroundColor: string
}

function PictureInput({ picture, onPhotoChosen, backgroundColor }: Props) {
  const [showOptions, setShowOptions] = useState(false)
  const updateShowOptions = (show: boolean) => () => setShowOptions(show)

  const { t } = useTranslation(Namespaces.accountScreen10)

  const pickPhoto = async (pickerFunction: typeof ImagePicker.openPicker) => {
    try {
      const image = await pickerFunction({
        width: 150,
        height: 150,
        cropping: true,
        includeBase64: true,
        cropperCircleOverlay: true,
        cropperChooseText: t('global:choose'),
        cropperCancelText: t('global:cancel'),
      })
      // @ts-ignore
      onPhotoChosen(getDataURL(image.mime, image.data))
    } catch (e) {
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
          onPhotoChosen(null)
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
        <View style={styles.photoIconContainer}>
          <Photo />
        </View>
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
  photoIconContainer: {
    width: 32,
    height: 32,
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: colors.greenUI,
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

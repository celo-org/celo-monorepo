import * as RNFS from 'react-native-fs'
import Logger from 'src/utils/Logger'

const mimeTypeToExtension: { [key: string]: string | undefined } = {
  'image/png': 'png',
  'image/x-png': 'png',
  'image/jpeg': 'jpeg',
  'image/pjpeg': 'jpeg',
  'image/jpg': 'jpg', // image/jpg is technically not a mime type, but handling it just in case.
}

export const extensionToMimeType: { [key: string]: string | undefined } = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
}

export const getDataURL = (mime: string, data: any) => `data:${mime};base64,${data}`

// Data URL format: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
export const saveImageDataUrlToFile = async (
  dataUrl: string,
  fileNameWithoutExtension: string
): Promise<string> => {
  const mimeType = dataUrl
    .split(':')[1]
    .split(',')[0]
    .split(';')[0]
  const extension = mimeTypeToExtension[mimeType] || 'jpg'
  const fileName = `${fileNameWithoutExtension}.${extension}`
  const data = dataUrl.substr(dataUrl.indexOf(',') + 1)
  await RNFS.writeFile(fileName, data, 'base64')
  Logger.info('Image saved successfully')
  return fileName
}

export const saveProfilePicture = async (dataUrl: string): Promise<string> => {
  return saveImageDataUrlToFile(
    dataUrl,
    `file://${RNFS.DocumentDirectoryPath}/profile-${Date.now()}`
  )
}

export const saveRecipientPicture = async (dataUrl: string, address: string): Promise<string> => {
  return saveImageDataUrlToFile(
    dataUrl,
    `file://${RNFS.DocumentDirectoryPath}/CIP8/pictures/${address}`
  )
}

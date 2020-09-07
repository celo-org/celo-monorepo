import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { RNCamera } from 'react-native-camera'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Defs, Mask, Rect, Svg } from 'react-native-svg'
import { Namespaces } from 'src/i18n'
import NotAuthorizedView from 'src/qrcode/NotAuthorizedView'
import { QrCode } from 'src/send/actions'

interface QRScannerProps {
  onBarCodeDetected: (qrCode: QrCode) => void
}

const SeeThroughOverlay = () => {
  const { width, height } = useSafeAreaFrame()

  const margin = 40
  const centerBoxSize = width - margin * 2
  const centerBoxBorderRadius = 8

  // TODO(jeanregisser): Investigate why the mask is pixelated on iOS.
  // It's visible on the rounded corners but since they are small, I'm ignoring it for now.
  return (
    <Svg height={height} width={width} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <Mask id="mask" x="0" y="0" height="100%" width="100%">
          <Rect height="100%" width="100%" fill="#fff" />
          <Rect
            x={margin}
            y={(height - centerBoxSize) / 2}
            rx={centerBoxBorderRadius}
            ry={centerBoxBorderRadius}
            width={centerBoxSize}
            height={centerBoxSize}
            fill="#000"
          />
        </Mask>
      </Defs>
      <Rect height="100%" width="100%" fill="rgba(0,0,0,0.5)" mask="url(#mask)" />
    </Svg>
  )
}

export default function QRScanner({ onBarCodeDetected }: QRScannerProps) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const inset = useSafeAreaInsets()

  return (
    <RNCamera
      style={styles.camera}
      type={RNCamera.Constants.Type.back}
      onBarCodeRead={onBarCodeDetected}
      barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
      flashMode={RNCamera.Constants.FlashMode.auto}
      captureAudio={false}
      autoFocus={RNCamera.Constants.AutoFocus.on}
      // Passing null here since we want the default system message
      // @ts-ignore
      androidCameraPermissionOptions={null}
      notAuthorizedView={<NotAuthorizedView />}
      testID={'Camera'}
    >
      <SeeThroughOverlay />
      <Text style={[styles.infoText, { marginBottom: inset.bottom }]}>{t('cameraScanInfo')}</Text>
    </RNCamera>
  )
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    overflow: 'hidden',
  },
  infoBox: {
    paddingVertical: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.dark,
    opacity: 1,
    marginTop: 15,
    borderRadius: 3,
  },
  infoText: {
    position: 'absolute',
    left: 9,
    right: 9,
    bottom: 32,
    ...fontStyles.small600,
    lineHeight: undefined,
    color: colors.light,
    textAlign: 'center',
  },
})

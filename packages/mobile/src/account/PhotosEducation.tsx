import * as React from 'react'
import { connect } from 'react-redux'
import { photosNUXCompleted } from 'src/account/actions'
import Education from 'src/account/Education'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { addressBook, bigPhoneAvatar, cameraUpload } from 'src/images/Images'
import { navigateBack } from 'src/navigator/NavigationService'

interface DispatchProps {
  photosNUXCompleted: typeof photosNUXCompleted
}
type Props = DispatchProps

export class PhotosEducation extends React.Component<Props> {
  static navigationOptions = { header: null }
  goToWallet = () => {
    this.props.photosNUXCompleted()
    navigateBack()
  }

  render() {
    const stepInfo = [
      {
        image: addressBook,
        text: 'addressPhotos',
        cancelEvent: CustomEventNames.photo_education_cancel1,
        screenName: 'Photo_Nux_1',
      },
      {
        image: cameraUpload,
        text: 'changePhotos',
        cancelEvent: CustomEventNames.photo_education_cancel2,
        screenName: 'Photo_Nux_2',
      },
      {
        image: bigPhoneAvatar,
        text: 'localPhotos',
        cancelEvent: CustomEventNames.photo_education_cancel3,
        screenName: 'Photo_Nux_3',
      },
    ]
    return <Education stepInfo={stepInfo} onFinish={this.goToWallet} buttonText={'backToWallet'} />
  }
}

export default componentWithAnalytics(
  connect<{}, DispatchProps>(
    null,
    { photosNUXCompleted }
  )(PhotosEducation)
)

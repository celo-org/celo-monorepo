import firebase from '@react-native-firebase/app'

export type ContentType = { [lang: string]: any }

export const fetchConsumerRewardsContent = () => {
  return new Promise<ContentType>((resolve) => {
    firebase
      .database()
      .ref('consumerIncentives/content')
      .once('value')
      .then((snapshot) => resolve(snapshot.val()))
  })
}

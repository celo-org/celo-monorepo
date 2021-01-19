import firebase from '@react-native-firebase/app'

export interface ContentType {
  [lang: string]: any
}

export const fetchConsumerRewardsContent = () =>
  firebase
    .database()
    .ref('consumerIncentives/content')
    .once('value')
    .then((snapshot) => snapshot.val())

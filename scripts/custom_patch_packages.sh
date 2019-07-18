
# patch segment nested package, package-patch does not seem to support this complex case
patch --forward node_modules/@segment/analytics-react-native-firebase/android/build.gradle patches/segment_analytics-firebase_bundle.patch || echo "Patch seems to be already applied"

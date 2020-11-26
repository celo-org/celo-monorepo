# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Detox
-keep class com.facebook.react.ReactInstanceManager { *; }

# RN Firebase
-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**

# Segment https://segment.com/docs/connections/sources/catalog/libraries/mobile/android/android-faqs/#sts=How%20should%20I%20configure%20Proguard?
-keep class com.segment.analytics.** { *; }
-keep class androidx.lifecycle.DefaultLifecycleObserver

-keep class org.ethereum.geth.** { *; }
-keep class org.celo.mobile.BuildConfig { *; }
-keep public class com.horcrux.svg.** {*;}
-keep class com.rt2zz.reactnativecontacts.** {*;}
-keepclassmembers class com.rt2zz.reactnativecontacts.** {*;}

# Instabug
-dontwarn com.instabug.**

# React-native-bls-threshold (for its JNA dependency)
-dontwarn java.awt.*
-keep class com.sun.jna.* { *; }
-keepclassmembers class * extends com.sun.jna.* { public *; }

# Hermes
-keep class com.facebook.jni.** { *; }

# Keychain
-keep class com.facebook.crypto.** {
   *;
}
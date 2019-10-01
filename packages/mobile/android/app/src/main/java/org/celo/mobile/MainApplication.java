package org.celo.mobile;

import android.content.Context;
import android.app.Application;

import org.reactnative.camera.RNCameraPackage;
import com.chirag.RNMail.RNMail;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import io.xogus.reactnative.versioncheck.RNVersionCheckPackage;
import com.levelasquez.androidopensettings.AndroidOpenSettingsPackage;
import com.tradle.react.UdpSocketsModule;

import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.storage.RNFirebaseStoragePackage;
import io.invertase.firebase.database.RNFirebaseDatabasePackage;
import io.invertase.firebase.auth.RNFirebaseAuthPackage;
import com.peel.react.TcpSocketsModule;
import io.sentry.RNSentryPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.corbt.keepawake.KCKeepAwakePackage;
import com.facebook.react.ReactApplication;
import com.burnweb.rnsendintent.RNSendIntentPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.segment.analytics.reactnative.integration.firebase.RNAnalyticsIntegration_FirebasePackage;
import com.segment.analytics.reactnative.core.RNAnalyticsPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.horcrux.svg.SvgPackage;
import com.kristiansorens.flagsecure.FlagSecurePackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.levelasquez.androidopensettings.AndroidOpenSettingsPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.peel.react.TcpSocketsModule;
import com.reactcommunity.rnlocalize.RNLocalizePackage;
import com.reactnativegeth.RNGethPackage;
import com.rnfs.RNFSPackage;
import com.rt2zz.reactnativecontacts.ReactNativeContacts;
import com.tradle.react.UdpSocketsModule;
import org.celo.devicecredentials.RNConfirmDeviceCredentialsPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.rnrestartandroid.RNRestartAndroidPackage;
import me.furtado.smsretriever.RNSmsRetrieverPackage;
import cl.json.RNSharePackage;
import cl.json.ShareApplication;
import com.rninstallreferrer.RNInstallReferrerPackage;
import com.reactlibrary.securekeystore.RNSecureKeyStorePackage;

import android.util.Log;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import ru.ivanarh.jndcrash.NDCrashError;
import ru.ivanarh.jndcrash.NDCrash;
import ru.ivanarh.jndcrash.NDCrashUnwinder;

// Disabled due to dex count
// import com.swmansion.rnscreens.RNScreensPackage;

public class MainApplication extends Application implements ShareApplication, ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {

      ReactPackage basePackages[] = new ReactPackage[] {
              new MainReactPackage(),
              new RNInstallReferrerPackage(),
              new RNSendIntentPackage(),
              new RNCWebViewPackage(),
              new NetInfoPackage(),
              new RNGestureHandlerPackage(),
              new RNAnalyticsIntegration_FirebasePackage(),
              new RNAnalyticsPackage(),
              new RNCameraPackage(),
              new RNMail(),
              new SplashScreenReactPackage(),
              new AndroidOpenSettingsPackage(),
              new UdpSocketsModule(),
              new RNLocalizePackage(),
              new ReactNativeConfigPackage(),
              new RNFirebasePackage(),
              new RNFirebaseMessagingPackage(),
              new RNFirebaseNotificationsPackage(),
              new RNFirebaseDatabasePackage(),
              new RNFirebaseAuthPackage(),
              new TcpSocketsModule(),
              new RNSentryPackage(),
              new RandomBytesPackage(),
              new SvgPackage(),
              new ReactNativeContacts(),
              new KCKeepAwakePackage(),
              new RNDeviceInfo(),
              new RNFSPackage(),
              new RNGethPackage(),
              new FlagSecurePackage(),
              new RNFirebaseStoragePackage(),
              new RNVersionCheckPackage(),
              new RNRestartAndroidPackage(),
              new RNSmsRetrieverPackage(),
              new RNSharePackage(),
              new RNSecureKeyStorePackage()
              // Disabled due to dex count
              // new RNScreensPackage(),
      };
      List<ReactPackage> packageList = new ArrayList<>();
      packageList.addAll(Arrays.asList(basePackages));
      if (android.os.Build.VERSION.SDK_INT >= 23) {
        // Don't add this package below API 23, since it leads to
        // ClassDefNotFoundError due to classes which are only available
        // above API 23.
        packageList.add(new RNConfirmDeviceCredentialsPackage());
      }

      return packageList;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    initNdkCrashHandler();
  }

  @Override
  public String getFileProviderAuthority() {
    return BuildConfig.APPLICATION_ID + ".provider";
  }

  // Set up the NDK crash handler - this is useful for catching Geth crashes
  private void initNdkCrashHandler() {
    final String reportPath = NdkCrashService.getNdkCrashLogReportPath(this);
    final NDCrashError error = NDCrash.initializeOutOfProcess(this, reportPath, NDCrashUnwinder.libunwind,
        NdkCrashService.class);
    if (error == NDCrashError.ok) {
      Log.i("MainApplication@initJndcrash", "NDK crash handler init successful");
    } else {
      Log.e("MainApplication@initJndcrash", "NDK crash handler init failed: " + error);
    }
  }
}

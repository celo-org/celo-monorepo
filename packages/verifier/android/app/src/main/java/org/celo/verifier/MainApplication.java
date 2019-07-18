package org.celo.verifier;

import android.app.Application;
import org.celo.verifier.BuildConfig;
import com.facebook.react.ReactApplication;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.segment.analytics.reactnative.integration.firebase.RNAnalyticsIntegration_FirebasePackage;
import com.segment.analytics.reactnative.core.RNAnalyticsPackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.auth.RNFirebaseAuthPackage;
import io.invertase.firebase.database.RNFirebaseDatabasePackage;
import com.reactcommunity.rnlanguages.RNLanguagesPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.horcrux.svg.SvgPackage;
import com.rnfs.RNFSPackage;
import com.rnrestartandroid.RNRestartAndroidPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import java.util.Arrays;
import java.util.List;
import org.devio.rn.splashscreen.SplashScreenReactPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new NetInfoPackage(),
              new RNGestureHandlerPackage(),
              new RNAnalyticsIntegration_FirebasePackage(),
              new RNAnalyticsPackage(),
              new RNFirebasePackage(),
              new RNFirebaseAuthPackage(),
              new RNFirebaseDatabasePackage(),
              new RNFSPackage(),
              new ReactNativeConfigPackage(),
              new SvgPackage(),
              new RNVerifierServicePackage(),
              new RNLanguagesPackage(),
              new SplashScreenReactPackage(),
              new RNRestartAndroidPackage(),
              new RNDeviceInfo()
      );
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
  }
}

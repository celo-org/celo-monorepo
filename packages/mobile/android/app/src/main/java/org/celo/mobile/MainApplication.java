package org.celo.mobile;

import android.content.Context;
import android.util.Log;
import androidx.multidex.MultiDexApplication;
import cl.json.ShareApplication;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.reactnativegeth.RNGethPackage;
import io.invertase.firebase.auth.RNFirebaseAuthPackage;
import io.invertase.firebase.database.RNFirebaseDatabasePackage;
import io.invertase.firebase.links.RNFirebaseLinksPackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.storage.RNFirebaseStoragePackage;
import io.sentry.RNSentryPackage;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.celo.devicecredentials.RNConfirmDeviceCredentialsPackage;
import ru.ivanarh.jndcrash.NDCrash;
import ru.ivanarh.jndcrash.NDCrashError;
import ru.ivanarh.jndcrash.NDCrashUnwinder;

public class MainApplication
  extends MultiDexApplication
  implements ShareApplication, ReactApplication {
  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      if (android.os.Build.VERSION.SDK_INT >= 23) {
        // Don't add this package below API 23, since it leads to
        // ClassDefNotFoundError due to classes which are only available
        // above API 23.
        packages.add(new RNConfirmDeviceCredentialsPackage());
      }
      packages.add(new RNGethPackage());
      packages.add(new RNFirebaseAuthPackage());
      packages.add(new RNFirebaseDatabasePackage());
      packages.add(new RNFirebaseStoragePackage());
      packages.add(new RNFirebaseMessagingPackage());
      packages.add(new RNFirebaseNotificationsPackage());
      packages.add(new RNFirebaseLinksPackage());
      return packages;
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
    SoLoader.init(this, /* native exopackage */false);
    initializeFlipper(this); // Remove this line if you don't want Flipper enabled
    initNdkCrashHandler();
  }

  @Override
  public String getFileProviderAuthority() {
    return BuildConfig.APPLICATION_ID + ".provider";
  }

  // Set up the NDK crash handler - this is useful for catching Geth crashes
  private void initNdkCrashHandler() {
    final String reportPath = NdkCrashService.getNdkCrashLogReportPath(this);
    final NDCrashError error = NDCrash.initializeOutOfProcess(
      this,
      reportPath,
      NDCrashUnwinder.libunwind,
      NdkCrashService.class
    );
    if (error == NDCrashError.ok) {
      Log.i("MainApplication@initJndcrash", "NDK crash handler init successful");
    } else {
      Log.e("MainApplication@initJndcrash", "NDK crash handler init failed: " + error);
    }
  }

  /**
   * Loads Flipper in React Native templates.
   *
   * @param context
   */
  private static void initializeFlipper(Context context) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         * We use reflection here to pick up the class that initializes Flipper, since
         * Flipper library is not available in release mode
         */
        Class<?> aClass = Class.forName("com.facebook.flipper.ReactNativeFlipper");
        aClass.getMethod("initializeFlipper", Context.class).invoke(null, context);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
}

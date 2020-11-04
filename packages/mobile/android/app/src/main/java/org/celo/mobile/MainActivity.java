package org.celo.mobile;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import java.util.Date;
import org.devio.rn.splashscreen.SplashScreen;

public class MainActivity extends ReactActivity {
  long appStartedMillis;

  /**
   * Returns the name of the main component registered from JavaScript. This is
   * used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "celo";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    getWindow()
      .getDecorView()
      .setSystemUiVisibility(
        // fullscreen layout so we can draw under the status bar / notch area
        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
        View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
      );

    appStartedMillis = System.currentTimeMillis();
    SplashScreen.show(this, R.style.SplashTheme);
    super.onCreate(null);
  }

  @Override
  public void onResume() {
    super.onResume();
    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
  }

  @Override
  public void onPause() {
    super.onPause();
    getWindow()
      .setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
  }

  @Override
  public void onNewIntent(Intent intent) {
    // if firebase is not enabled this would cause a crash because of the firebase app not being inited
    // the better fix would be to have a test firebase running in CI
    // this is just a temporary fix until we get firebase working in all environments
    // the crash is on the native side. It looks like the react activity tries to call
    // firebase dynamic links, which in turn complains about firebase app not being initialized
    Boolean firebaseEnabled = Boolean.parseBoolean(BuildConfig.FIREBASE_ENABLED);
    if (firebaseEnabled) {
      super.onNewIntent(intent);
    }
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName()) {

      @Override
      protected ReactRootView createRootView() {
        return new RNGestureHandlerEnabledRootView(MainActivity.this);
      }

      @Override
      protected Bundle getLaunchOptions() {
        // This is used to pass props (in this case app start time) to React
        Bundle props = new Bundle();
        props.putLong("appStartedMillis", appStartedMillis);
        return props;
      }
    };
  }
}

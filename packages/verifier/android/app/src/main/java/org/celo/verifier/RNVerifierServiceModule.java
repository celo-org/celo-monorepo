package org.celo.verifier;

import org.celo.verifier.SMSLog;

import org.celo.verifier.PushNotificationToSMSService;

import java.io.IOException;
import java.net.*;

import android.support.annotation.Nullable;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.support.v4.content.LocalBroadcastManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import android.util.Log;

import java.lang.reflect.Type;
import java.util.Calendar;
import java.util.Date;
import java.util.ArrayList;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.Map;
import java.util.HashMap;
import java.util.List;


import java.text.DateFormat;
import java.text.SimpleDateFormat;

import com.google.firebase.iid.FirebaseInstanceId;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.ReactMethod;

public class RNVerifierServiceModule extends ReactContextBaseJavaModule {
    private static final String TAG = RNVerifierServiceModule.class.getSimpleName();
    // 15 minutes in milliseconds
    public static final int TIMER_INTERVAL_DEFAULT_VALUE = 900000;

    private final ScheduledThreadPoolExecutor mExec = new ScheduledThreadPoolExecutor(1);
    private  static ScheduledFuture<?> mTask;
    private SMSLogBroadcastReceiver mReceiver = new SMSLogBroadcastReceiver();

    /*
     * Task that's scheduled to ping google every n seconds. This is done to keep
     * The network connection open.
     * */
    class PingServerTask implements Runnable {

        private boolean isReachable(String addr, int openPort, int timeOutMillis) {
            try {
                try (Socket soc = new Socket()) {
                    soc.connect(new InetSocketAddress(addr, openPort), timeOutMillis);
                }
                return true;
            } catch (IOException ex) {
                return false;
            }
        }
        @Override
        public void run() {
            try {
                String host = "google.com";
                boolean reachable = isReachable(host, 80, 10000);
                Log.d(TAG, host + " is reachable " + reachable);
            } catch (Exception e){
                e.printStackTrace();
            }
        }
    }

    /*
     * Whenever the PushNotificationToSMSService gets a request to send a SMS it informs react native
     * via this broadcast receiver.
     * */
    private class SMSLogBroadcastReceiver extends BroadcastReceiver {
        List<SMSLog> mSMSLogs;

        public SMSLogBroadcastReceiver() {
            Context context = getReactApplicationContext();
            // Load all previous SMSLogs from the Shared Preferences.
            mSMSLogs =  PushNotificationToSMSService.getSMSLogsFromSharedPreferences(context);
            // Register broadcast receiver to listen for this intent from the service.
            IntentFilter intentFilter = new IntentFilter();
            intentFilter.addAction(PushNotificationToSMSService.EVENT_NAME_NOTIFY_SMS_LOG);
            LocalBroadcastManager.getInstance(context).registerReceiver(this, intentFilter);
        }

        @Override
        public void onReceive(Context context, Intent intent) {
            // When we receive an event, store it and then forward it on ReactNative via DeviceEmitter.
            switch (intent.getAction()) {
                case PushNotificationToSMSService.EVENT_NAME_NOTIFY_SMS_LOG:
                    Log.d(TAG, "Received NOTIFY_SMS_LOG request");
                    List<SMSLog> smsLogs = intent.getParcelableArrayListExtra(PushNotificationToSMSService.EXTRA_SMS_LOGS);
                    this.mSMSLogs = smsLogs;
                    try {
                        WritableArray smsArray = getSMSLogsAsWritableArray(smsLogs);
                        sendEvent(getReactApplicationContext(), PushNotificationToSMSService.EVENT_SMS_SENT, smsArray);
                    } catch (Exception e) {
                        Log.d(TAG, "onReceive error: " + e.getMessage());
                    }
                    break;
            }
        }

        public List<SMSLog>getmSMSLogs() {
            return mSMSLogs;
        }
    }

    public RNVerifierServiceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        // If service is on, start polling google on app start
        Log.d(TAG, "RNVerifierServiceModule created.");
        boolean serviceIsOff = PushNotificationToSMSService.serverOFF(reactContext);
        togglePingServer(!serviceIsOff);
    }

    @Override
    public String getName() {
        return "RNVerifierService";
    }

    /**
     * Expose smsSent as the constant used to listen for new sms events using React Native's DeviceEventEmitter.
     */
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put(PushNotificationToSMSService.EVENT_SMS_SENT, PushNotificationToSMSService.EVENT_SMS_SENT);
        return constants;
    }

    @ReactMethod
    public void toggleVerifierService(boolean enableSMS) {
        String status = enableSMS ? "ON" : "OFF";
        Context context = getReactApplicationContext();
        SharedPreferences prefs = context.getSharedPreferences(PushNotificationToSMSService.USER_PREF_STORE, Context.MODE_PRIVATE);
        Editor editor = prefs.edit();
        editor.putString(PushNotificationToSMSService.USER_PREF_SERVICE_STATUS, status);
        editor.commit();
        Log.d(TAG, "toggleVerifierService enableSMS: " + status);
        togglePingServer(enableSMS);
    }

    @ReactMethod
    public void getVerifierServiceStatus(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            String serviceStatus = PushNotificationToSMSService.getSMSServiceStatus(context);
            promise.resolve(serviceStatus);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void getFCMToken(Promise promise) {
        try {
            String token = FirebaseInstanceId.getInstance().getToken();
            promise.resolve(token);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    /**
     * Function used to keep network connection open by pinging a server.
     */
    private void togglePingServer(boolean enable) {
        if (enable) {
            Log.d(TAG, "Start pinging server");
            mTask = mExec.scheduleAtFixedRate(new PingServerTask(), 0, TIMER_INTERVAL_DEFAULT_VALUE, TimeUnit.MILLISECONDS);
        }
        else {
            Log.d(TAG, "Stop pinging server");
            if (mTask != null) {
                mTask.cancel(false);
            }
        }
    }

    /**
     * Function used to send array of SMSLogs to React Native using DeviceEmitter
     */
    private void sendEvent(ReactContext reactContext, String eventName,
                           @Nullable WritableArray params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    /*
     * Convert SMSLog to WritableArray so it can be passed across the react native bridge.
     * */
    private WritableArray getSMSLogsAsWritableArray(List<SMSLog> smsLogs) {
        WritableArray smsArray = new WritableNativeArray();
        for (SMSLog log : smsLogs ) {
            // Convert the SMSLog to a WritableMap
            WritableMap smsMap = new WritableNativeMap();
            smsMap.putString("PhoneNumber", (String) log.phoneNumber);
            smsMap.putString("Date", (String) log.date);
            smsMap.putString("messageId", (String) log.messageId);
            smsMap.putBoolean("SMSSent", (Boolean) log.smsSent);
            smsArray.pushMap(smsMap);
        }
        return smsArray;
    }

    /*
     * Return array of all requests to send SMS messages from this device.
     * */
   @ReactMethod
   public void getSMSSendLogs(Promise promise){
       try {
           List<SMSLog> smsLogs = mReceiver.getmSMSLogs();
           WritableArray smsArray = getSMSLogsAsWritableArray(smsLogs);
           promise.resolve(smsArray);
       } catch (Exception e) {
           Log.d(TAG, "getSMSSendLogs error: " + e.getMessage());
           promise.reject(e.getMessage());
       }
   }
}

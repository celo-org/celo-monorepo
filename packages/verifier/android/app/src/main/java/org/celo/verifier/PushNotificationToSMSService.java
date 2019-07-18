package org.celo.verifier;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Calendar;
import java.util.Date;

import android.os.Parcelable;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.pm.PackageManager;
import android.Manifest.permission;

import android.util.Log;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;
import android.support.v4.content.LocalBroadcastManager;
import android.support.v4.content.ContextCompat;

import java.io.Writer;
import java.io.PrintWriter;
import java.io.StringWriter;

import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.MutableData;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.Transaction;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/*
 * PushNotificationToSMSService can be started even if the app is not running from 
 * a push notification sent from a verification pool. 
*/

public class PushNotificationToSMSService extends FirebaseMessagingService {

    public static final String EVENT_NAME_NOTIFY_SMS_LOG = "smsLogNotification";
    public static final String EXTRA_SMS_LOGS = "smsLogs";
    public static final String EVENT_SMS_SENT = "smsSent";
    public static final String USER_PREF_SERVICE_STATUS = "serviceStatus";
    public static final String USER_PREF_STORE = "User";
    private static final String TAG = "PushNotificationToSMSService";
    private static final int SMS_LENGTH_LIMIT = 160;
    private static final long MESSAGE_CLAIM_TIMEOUT = 10;

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "New remote message received from " +  remoteMessage.getFrom());

        try {
            Context context = getApplicationContext();
            if (PushNotificationToSMSService.serverOFF(context)) {
                Log.d(TAG, "The service has been turned off. Skipping.");
                return;
            }
            if (!canSendSMS()){
                Log.d(TAG, "The service cannot send SMS. Skipping.");
                return;
            }
            Map<String, String> data = remoteMessage.getData();
            if (data == null) {
                Log.d(TAG, "Remote message contains no data payload. Skipping.");
                return;
            }
            final String messageId = data.get("messageId");
            if (messageId == null) {
                Log.d(TAG, "messageId missing from push notification payload. Skipping.");
                return;
            }
            Log.d(TAG, "Found messageId in payload: " + messageId);

            // Prep Firebase resources
            FirebaseDatabase database = FirebaseDatabase.getInstance();
            String path = BuildConfig.DEFAULT_TESTNET + "/messages/" + messageId;
            Log.d(TAG, "Using message ref path " + path);
            final DatabaseReference messageRef = database.getReference(path);
            final String uid = FirebaseAuth.getInstance().getCurrentUser().getUid();
            Log.d(TAG, "Using auth UID " + uid);

            // Run the db transaction to try to atomically claim the message
            messageRef.runTransaction(new Transaction.Handler() {
              @Override
              public Transaction.Result doTransaction(MutableData currentData) {
                  Log.d(TAG+"@runTransaction", "Running transaction for message " + messageId);
                  SMSMessage message = currentData.getValue(SMSMessage.class);
                  if (message == null) {
                      Log.d(TAG+"@runTransaction", "Message object is null, local cache may not be ready.");
                      return Transaction.success(currentData);
                  }

                  if (message.message != null && message.message.length() >= SMS_LENGTH_LIMIT) {
                      Log.d(TAG+"@runTransaction", "Message exceeds SMS length limit");
                      return Transaction.abort();
                  }

                  if (message.messageState != MessageState.DISPATCHING.ordinal() 
                    || (message.verifierId != null && !message.verifierId.isEmpty())) {
                      Log.d(TAG+"@runTransaction", "Message is already assigned or sent.");
                      return Transaction.abort();
                  }

                  Log.d(TAG+"@runTransaction", "Message is valid and unassigned. Attempting to claim.");
                  message.messageState = MessageState.ASSIGNED.ordinal();
                  message.verifierId = uid;
                  currentData.setValue(message);
                  return Transaction.success(currentData);
              }

              @Override
              public void onComplete(DatabaseError error, boolean committed, DataSnapshot snapshot) {
                  Log.d(TAG+"@runTransaction", "Transaction complete for message " + messageId);
                  if (error != null) {
                      Log.e(TAG+"@runTransaction", "Message transaction error: " + error.getMessage() + " : " + error.getDetails());
                      return;
                  }

                  if (!committed) {
                      Log.d(TAG+"@runTransaction", "Message transaction not committed. Not sending SMS.");
                      return;
                  }

                  if (snapshot == null || !snapshot.exists()) {
                      Log.e(TAG+"@runTransaction", "Data snapshot for message is null. Not sending SMS.");
                      return;
                  }

                  SMSMessage message = snapshot.getValue(SMSMessage.class);
                  if (message.messageState != MessageState.ASSIGNED.ordinal() || message.verifierId != uid) {
                      Log.e(TAG+"@runTransaction", "Message tx commited but it is not assigned to this verifier. This should never happen.");
                      return;
                  }

                  Log.d(TAG+"@runTransaction", "Message claimed successfully. Will attempt to send SMS");
                  sendSMS(message.phoneNum, message.message, messageId);
              }
            });
        }
        catch (Exception e) {
            Log.e(TAG, "Error handling push notification.");
            Writer writer = new StringWriter();
            e.printStackTrace(new PrintWriter(writer));
            String s = writer.toString();
            Log.e(TAG, "Stacktrace data " +  s);
        }
    }

    private Boolean canSendSMS() {
        return ((TelephonyManager) getApplicationContext().getSystemService(Context.TELEPHONY_SERVICE)).isSmsCapable()
                && ContextCompat.checkSelfPermission(getApplicationContext(), permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;
    }

    private void sendSMS(String phoneNumber, String message, final String messageId) {
        if (phoneNumber == null || message == null || messageId == null) {
            Log.d(TAG, "sendSMS called with a null parameter");
            return;
        }
        Log.d(TAG, "Send sms to " + phoneNumber + " containing " + message + " fetched from messageId: " + messageId);
        try {
            // See SMSStatusBroadcastReceiver for how we track if SMS actually got sent or failed.
            Intent sendSMS = new Intent(SMSStatusBroadcastReceiver.SMS_SENT_INTENT, null, this, SMSStatusBroadcastReceiver.class);
            sendSMS.putExtra(SMSStatusBroadcastReceiver.MESSAGE_ID_KEY, messageId);
            PendingIntent sentPI = PendingIntent.getBroadcast(getApplicationContext(), 0, sendSMS, PendingIntent.FLAG_UPDATE_CURRENT);

            // Send SMS
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phoneNumber, null, message, sentPI, null);
            Intent smsLogIntent = new Intent(EVENT_NAME_NOTIFY_SMS_LOG);

            String pattern = "EEE, d MMM yyyy HH:mm aaa";
            DateFormat df = new SimpleDateFormat(pattern);
            Date today = Calendar.getInstance().getTime();

            // Log SMS to preferences
            String sendDate = df.format(today);
            SMSLog log = new SMSLog(true, sendDate, phoneNumber, messageId);
            saveSMSLogToSharedPreferences(log);

            List<SMSLog> smsLogs = getSMSLogsFromSharedPreferences(getApplicationContext());
            String numberOfSMS = Integer.toString(smsLogs.size());
            smsLogIntent.putParcelableArrayListExtra(EXTRA_SMS_LOGS, (ArrayList<? extends Parcelable>)smsLogs);
            // Broadcast array of all smsLogs from service to module so it can emit them to react native app
            LocalBroadcastManager.getInstance(getApplicationContext())
                    .sendBroadcast(smsLogIntent);
        }

        catch (Exception e) {
            Log.e(TAG, "Error sending SMS for message " + messageId);
            e.printStackTrace();
        }
    }

    public static boolean serverOFF(Context context) {
        String serviceStatus = PushNotificationToSMSService.getSMSServiceStatus(context);
        return serviceStatus.equals("OFF");
    }

    public static String getSMSServiceStatus(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PushNotificationToSMSService.USER_PREF_STORE, Context.MODE_PRIVATE);
        String serviceStatus = prefs.getString(PushNotificationToSMSService.USER_PREF_SERVICE_STATUS, "ON");
        return serviceStatus;
    }

    private void saveSMSLogToSharedPreferences(SMSLog log) {
        // Get all existing logs from users preferences
        List<SMSLog> smsLogs = getSMSLogsFromSharedPreferences(getApplicationContext());
        smsLogs.add(log);
        // Write to user preferences.
        SharedPreferences prefs = getSharedPreferences(USER_PREF_STORE, Context.MODE_PRIVATE);
        Editor editor = prefs.edit();
        Gson gson = new Gson();
        Gson objGson = new GsonBuilder().setPrettyPrinting().create();
        String jsonSMSLogs = objGson.toJson(smsLogs);
        editor.putString(EXTRA_SMS_LOGS, jsonSMSLogs);
        editor.commit();
    }

    public static List<SMSLog> getSMSLogsFromSharedPreferences(Context context) {
        List<SMSLog> smsLogs = new ArrayList<SMSLog>();

        // Read from user store
        SharedPreferences prefs = context.getSharedPreferences(PushNotificationToSMSService.USER_PREF_STORE, Context.MODE_PRIVATE);
        Gson gson = new Gson();
        String jsonSMSLogs = prefs.getString(PushNotificationToSMSService.EXTRA_SMS_LOGS, null);
        if (jsonSMSLogs != null) {
            Type listSMSLogType = new TypeToken<ArrayList<SMSLog>>(){}.getType();
            smsLogs = gson.fromJson(jsonSMSLogs, listSMSLogType);
        } else {
            Log.d(TAG, "jsonSMSLogs null ");
        }
        return smsLogs;
    }
}

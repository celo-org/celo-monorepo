package org.celo.mobile;

import java.io.FileWriter;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;

import android.util.Log;
import android.content.Context;

import ru.ivanarh.jndcrash.NDCrashService;

public class NdkCrashService extends NDCrashService {

    private static final String TAG = "CrashService";
    private static final int NUM_LOGCAT_LINES = 4000;

    public static String getNdkCrashLogReportPath(Context context) {
        return new File(context.getCacheDir().getAbsolutePath(), "ndk_crash_logs.txt").getAbsolutePath();
    }
    
    private static String getNdkCrashLogcatLogsPath(Context context) {
        return new File(context.getCacheDir().getAbsolutePath(), "ndk_crash_logcat_logs.txt").getAbsolutePath();
    }

    @Override
    public void onCrash(String reportPath) {
        String logcatLogs = getLogcatLogs(NUM_LOGCAT_LINES);
        String ndkLogcatLogsReportPath = getNdkCrashLogcatLogsPath(this);
        Log.i(TAG, "onCrash, stack trace in " + reportPath);
        Log.i(TAG, "onCrash, logcat logs are in " + ndkLogcatLogsReportPath);
        Log.d(TAG, "Logcat logs for the native error (from last " + NUM_LOGCAT_LINES + " lines): \"" + logcatLogs + "\"");
        try (FileWriter fileWriter = new FileWriter(ndkLogcatLogsReportPath, false /* append */)) {
            for (String line : logcatLogs.split("\n")) {
                // Build fingerprint marks the beginning of native crash dump which is already
                // present in the reportPath file.
                if (line.contains("Build fingerprint")) {
                    break;
                }
                fileWriter.write(line);
                fileWriter.write("\n");
            }
            fileWriter.flush();
        } catch (IOException e) {
            Log.e(TAG, "Error writing more logs to native crash report " + reportPath);
        }
    }

    private static String getLogcatLogs(int numLines) {
        // Multiple -b parameters seem to work on all versions from API 16 to 28.
        // Single comma-separated -b parameter works on API 28 but not on 16. I have
        // not tested at which version the change happened.
        String cmd = "logcat -d -v threadtime -b main -b system -t " + numLines + " *:E";
        try {
            Process process = Runtime.getRuntime().exec(cmd);
            try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                StringBuilder log = new StringBuilder();
                String line = "";
                while ((line = bufferedReader.readLine()) != null) {
                    log.append(line).append("\n");
                }
                return log.toString();
            }
        } catch (IOException e) {
            Log.e(TAG, "Error reading logcat logs");
            return "";
        }
    }
}

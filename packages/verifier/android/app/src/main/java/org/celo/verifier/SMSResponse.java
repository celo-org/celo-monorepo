package org.celo.verifier;

import android.os.Parcel;
import android.os.Parcelable;

public class SMSResponse implements Parcelable {
    public String phoneNumber;
    public String message;
    public String messageId;
    public boolean sent;
    public boolean failed;

    protected SMSResponse(Parcel in) {
        phoneNumber = in.readString();
        message = in.readString();
        messageId = in.readString();
        sent = in.readByte() != 0;
        failed = in.readByte() != 0;
    }

    public static final Creator<SMSResponse> CREATOR = new Creator<SMSResponse>() {
        @Override
        public SMSResponse createFromParcel(Parcel in) {
            return new SMSResponse(in);
        }

        @Override
        public SMSResponse[] newArray(int size) {
            return new SMSResponse[size];
        }
    };

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(phoneNumber);
        dest.writeString(message);
        dest.writeByte((byte) (sent ? 1 : 0));
        dest.writeByte((byte) (failed ? 1 : 0));
    }
}

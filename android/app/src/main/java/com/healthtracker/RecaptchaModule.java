package com.healthtracker;

import android.app.Activity;
import android.app.Application;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.recaptcha.Recaptcha;
import com.google.android.recaptcha.RecaptchaAction;
import com.google.android.recaptcha.RecaptchaTasksClient;

public class RecaptchaModule extends ReactContextBaseJavaModule {
    private static final String SITE_KEY = "6LeRvwApAAAAAK1TazuGGlQyaW5iqbA7k2TxK2Co";
    @Nullable private RecaptchaTasksClient tasksClient = null;
    private final ReactApplicationContext reactContext;

    RecaptchaModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "RecaptchaModule";
    }

    @ReactMethod
    public void initRecaptcha(final Promise promise) {
        try {
            // Convert to Application as required by the API
            Application app = (Application) reactContext.getApplicationContext();
            
            Recaptcha.fetchTaskClient(app, SITE_KEY)
                .addOnSuccessListener(client -> {
                    tasksClient = client;
                    promise.resolve(true);
                })
                .addOnFailureListener(e -> {
                    promise.reject("INIT_ERROR", "Failed to initialize reCAPTCHA: " + e.getMessage());
                });
        } catch (Exception e) {
            promise.reject("UNEXPECTED_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void verifyForPhoneAuth(final Promise promise) {
        if (tasksClient == null) {
            promise.reject("CLIENT_NOT_INITIALIZED", "reCAPTCHA client has not been initialized");
            return;
        }

        try {
            tasksClient.executeTask(RecaptchaAction.custom("phone_auth"))
                .addOnSuccessListener(token -> {
                    promise.resolve(token);
                })
                .addOnFailureListener(e -> {
                    promise.reject("VERIFICATION_ERROR", "Failed to verify: " + e.getMessage());
                });
        } catch (Exception e) {
            promise.reject("UNEXPECTED_ERROR", e.getMessage());
        }
    }
} 
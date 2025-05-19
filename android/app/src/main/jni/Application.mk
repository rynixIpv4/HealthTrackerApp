APP_BUILD_SCRIPT := $(call my-dir)/Android.mk
APP_ABI := armeabi-v7a x86 arm64-v8a x86_64
APP_PLATFORM := android-24
APP_STL := c++_shared
APP_CPPFLAGS := -std=c++20

# React Native Reanimated uses these, make sure to include
APP_ALLOW_MISSING_DEPS := true 
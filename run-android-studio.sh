#!/bin/bash

# Set Android SDK environment variables
export ANDROID_HOME=/Users/krishnadeepaktatikonda/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Open Android Studio with the project
npx cap open android

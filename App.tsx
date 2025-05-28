import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { TamaguiProvider, Theme, Button, YStack } from 'tamagui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import your Tamagui config
import config from './tamagui.config';

// Import wallet provider
import { WalletProvider } from './src/contexts/WalletContext';
import { useWallet } from './src/hooks/useWallet';
import { DexButton } from './src/components/buttons';
import { FadeIn, SlideIn } from './src/components/animations';

// Import navigation
import { AppNavigator } from './src/navigation/AppNavigator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subText: {
    color: '#8E8E93',
    fontSize: 16,
  },
});

export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter: '@tamagui/font-inter/otf/Inter-Medium.otf',
    InterBold: '@tamagui/font-inter/otf/Inter-Bold.otf',
  });

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config}>
        <Theme name="dark">
          <WalletProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <AppNavigator />
            </NavigationContainer>
          </WalletProvider>
        </Theme>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

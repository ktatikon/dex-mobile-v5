# Animations for DEX Mobile App

## Setup Animations Directory

Create a directory structure:
```
src/
  components/
    animations/
      FadeIn.tsx
      SlideIn.tsx
      TokenSwapAnimation.tsx
      LoadingIndicator.tsx
      index.ts
    lottie/
      loading.json
      success.json
      error.json
```

## FadeIn.tsx - Fade In Animation Component

```typescript
import React, { ReactNode } from 'react';
import { MotiView } from 'moti';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  from?: number;
  to?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 500,
  from = 0,
  to = 1,
}) => {
  return (
    <MotiView
      from={{ opacity: from }}
      animate={{ opacity: to }}
      transition={{
        type: 'timing',
        duration,
        delay,
      }}
    >
      {children}
    </MotiView>
  );
};
```

## SlideIn.tsx - Slide In Animation Component

```typescript
import React, { ReactNode } from 'react';
import { MotiView } from 'moti';

interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  duration?: number;
  distance?: number;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'bottom',
  delay = 0,
  duration = 500,
  distance = 50,
}) => {
  const getFromStyles = () => {
    switch (direction) {
      case 'left':
        return { translateX: -distance, opacity: 0 };
      case 'right':
        return { translateX: distance, opacity: 0 };
      case 'top':
        return { translateY: -distance, opacity: 0 };
      case 'bottom':
        return { translateY: distance, opacity: 0 };
      default:
        return { translateY: distance, opacity: 0 };
    }
  };

  return (
    <MotiView
      from={getFromStyles()}
      animate={{ translateX: 0, translateY: 0, opacity: 1 }}
      transition={{
        type: 'timing',
        duration,
        delay,
      }}
    >
      {children}
    </MotiView>
  );
};
```

## TokenSwapAnimation.tsx - Token Swap Animation

```typescript
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { ArrowUpDown } from 'lucide-react-native';
import { XStack, YStack, Circle, Text } from 'tamagui';

interface TokenSwapAnimationProps {
  fromTokenSymbol: string;
  toTokenSymbol: string;
  onSwapPress?: () => void;
}

export const TokenSwapAnimation: React.FC<TokenSwapAnimationProps> = ({
  fromTokenSymbol,
  toTokenSymbol,
  onSwapPress,
}) => {
  return (
    <YStack alignItems="center" justifyContent="center" space="$4">
      <XStack width="100%" justifyContent="space-between" alignItems="center">
        <MotiView
          from={{ translateY: 0, opacity: 0.5 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            loop: true,
            repeatReverse: true,
          }}
        >
          <Circle size={50} backgroundColor="$dexSecondary">
            <Text color="$dexTextPrimary" fontWeight="bold">
              {fromTokenSymbol}
            </Text>
          </Circle>
        </MotiView>

        <MotiView
          style={styles.swapButton}
          from={{ rotate: '0deg' }}
          animate={{ rotate: '180deg' }}
          transition={{
            loop: false,
            type: 'timing',
            duration: 300,
            easing: Easing.inOut(Easing.ease),
          }}
        >
          <Circle
            size={40}
            backgroundColor="$dexPrimary"
            pressStyle={{ scale: 0.95 }}
            onPress={onSwapPress}
          >
            <ArrowUpDown size={20} color="white" />
          </Circle>
        </MotiView>

        <MotiView
          from={{ translateY: 0, opacity: 0.5 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            loop: true,
            repeatReverse: true,
            delay: 500, // Offset to create wave effect
          }}
        >
          <Circle size={50} backgroundColor="$dexSecondary">
            <Text color="$dexTextPrimary" fontWeight="bold">
              {toTokenSymbol}
            </Text>
          </Circle>
        </MotiView>
      </XStack>
    </YStack>
  );
};

const styles = StyleSheet.create({
  swapButton: {
    zIndex: 10,
  },
});
```

## LoadingIndicator.tsx - Lottie Loading Animation

```typescript
import React from 'react';
import LottieView from 'lottie-react-native';
import { View, StyleSheet } from 'react-native';
import { Text, YStack } from 'tamagui';

interface LoadingIndicatorProps {
  message?: string;
  size?: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  size = 100,
}) => {
  return (
    <YStack alignItems="center" justifyContent="center" space="$2">
      <View style={[styles.lottieContainer, { width: size, height: size }]}>
        <LottieView
          source={require('../lottie/loading.json')}
          autoPlay
          loop
          style={{ width: size, height: size }}
        />
      </View>
      {message && (
        <Text color="$dexTextSecondary" fontSize={14}>
          {message}
        </Text>
      )}
    </YStack>
  );
};

const styles = StyleSheet.create({
  lottieContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## index.ts - Export Animation Components

```typescript
export * from './FadeIn';
export * from './SlideIn';
export * from './TokenSwapAnimation';
export * from './LoadingIndicator';
```

## Usage Example

```typescript
import React from 'react';
import { View } from 'react-native';
import { FadeIn, SlideIn, TokenSwapAnimation, LoadingIndicator } from '../components/animations';
import { Text, YStack } from 'tamagui';

const AnimationExample = () => {
  return (
    <YStack padding="$4" space="$6">
      <FadeIn delay={300}>
        <Text fontSize={24} fontWeight="bold" color="$dexTextPrimary">
          Welcome to DEX Mobile
        </Text>
      </FadeIn>

      <SlideIn direction="bottom" delay={500}>
        <Text fontSize={16} color="$dexTextSecondary">
          Trade tokens instantly with the best rates
        </Text>
      </SlideIn>

      <TokenSwapAnimation
        fromTokenSymbol="ETH"
        toTokenSymbol="USDT"
        onSwapPress={() => console.log('Swap tokens')}
      />

      <LoadingIndicator message="Fetching best rates..." />
    </YStack>
  );
};

export default AnimationExample;
```

## Lottie Animation Files

You'll need to download or create Lottie animation files:

1. For loading.json - A simple loading spinner with your primary color
2. For success.json - A checkmark animation in green
3. For error.json - An error animation in red

You can find free Lottie animations at:
- https://lottiefiles.com/
- https://lordicon.com/

Make sure to download the animations and place them in the src/components/lottie directory.

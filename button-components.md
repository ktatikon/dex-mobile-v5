# Button Components for DEX Mobile App

## Create a Button Component Directory

Create a directory structure:
```
src/
  components/
    buttons/
      DexButton.tsx
      IconButton.tsx
      index.ts
```

## DexButton.tsx - Primary Button Component

```typescript
import React from 'react';
import { Button, styled, Text, Theme, XStack } from 'tamagui';
import { ActivityIndicator } from 'react-native';

// Define button props
export interface DexButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

// Create a styled button component
const StyledButton = styled(Button, {
  borderRadius: '$button',
  overflow: 'hidden',
  
  variants: {
    variant: {
      primary: {
        backgroundColor: '$dexPrimary',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$dexPrimary',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    },
    size: {
      small: {
        height: 36,
        paddingHorizontal: 12,
      },
      medium: {
        height: 48,
        paddingHorizontal: 16,
      },
      large: {
        height: 56,
        paddingHorizontal: 20,
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
    fullWidth: false,
  },
});

// Create a styled text component for the button
const ButtonText = styled(Text, {
  color: '$dexTextPrimary',
  fontWeight: '600',
  
  variants: {
    variant: {
      primary: {
        color: 'white',
      },
      outline: {
        color: '$dexPrimary',
      },
      ghost: {
        color: '$dexPrimary',
      },
    },
    size: {
      small: {
        fontSize: 14,
      },
      medium: {
        fontSize: 16,
      },
      large: {
        fontSize: 18,
      },
    },
  } as const,
});

export const DexButton: React.FC<DexButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  isLoading = false,
  disabled = false,
  fullWidth = false,
}) => {
  return (
    <Theme name={variant === 'primary' ? 'primary' : 'dark'}>
      <StyledButton
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        onPress={onPress}
        disabled={disabled || isLoading}
        opacity={disabled ? 0.5 : 1}
        animation="quick"
        pressStyle={{ scale: 0.97, opacity: 0.9 }}
      >
        <XStack space="$2" alignItems="center" justifyContent="center">
          {isLoading ? (
            <ActivityIndicator 
              size="small" 
              color={variant === 'primary' ? 'white' : '#FF3B30'} 
            />
          ) : (
            <>
              {icon && icon}
              <ButtonText variant={variant} size={size}>
                {label}
              </ButtonText>
            </>
          )}
        </XStack>
      </StyledButton>
    </Theme>
  );
};
```

## IconButton.tsx - Icon Button Component

```typescript
import React from 'react';
import { Button, styled, Theme } from 'tamagui';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const StyledIconButton = styled(Button, {
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 999, // Circular button
  
  variants: {
    variant: {
      primary: {
        backgroundColor: '$dexPrimary',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$dexSecondary',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    },
    size: {
      small: {
        width: 36,
        height: 36,
      },
      medium: {
        width: 44,
        height: 44,
      },
      large: {
        width: 56,
        height: 56,
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
});

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
}) => {
  return (
    <Theme name={variant === 'primary' ? 'primary' : 'dark'}>
      <StyledIconButton
        variant={variant}
        size={size}
        onPress={onPress}
        disabled={disabled}
        opacity={disabled ? 0.5 : 1}
        animation="quick"
        pressStyle={{ scale: 0.95, opacity: 0.9 }}
      >
        {icon}
      </StyledIconButton>
    </Theme>
  );
};
```

## index.ts - Export Components

```typescript
export * from './DexButton';
export * from './IconButton';
```

## Usage Example

```typescript
import React from 'react';
import { View } from 'react-native';
import { DexButton, IconButton } from '../components/buttons';
import { ArrowUpDown } from 'lucide-react-native'; // You'll need to install lucide-react-native

const ButtonExample = () => {
  return (
    <View style={{ padding: 16, gap: 16 }}>
      {/* Primary Button */}
      <DexButton 
        label="Swap Tokens" 
        onPress={() => console.log('Swap pressed')} 
        variant="primary"
        fullWidth
      />
      
      {/* Outline Button */}
      <DexButton 
        label="Connect Wallet" 
        onPress={() => console.log('Connect pressed')} 
        variant="outline"
        icon={<ArrowUpDown size={20} color="#FF3B30" />}
      />
      
      {/* Icon Button */}
      <IconButton 
        icon={<ArrowUpDown size={24} color="white" />} 
        onPress={() => console.log('Icon pressed')} 
        variant="primary"
      />
      
      {/* Loading Button */}
      <DexButton 
        label="Loading..." 
        onPress={() => {}} 
        isLoading={true}
      />
    </View>
  );
};

export default ButtonExample;
```

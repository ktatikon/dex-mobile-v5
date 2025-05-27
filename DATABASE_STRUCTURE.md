# DEX Mobile V5 - Database Structure Documentation

## 📊 Overview

This document provides a comprehensive overview of the database structure and Supabase integration in the DEX Mobile V5 project.

## 🏗️ Directory Structure

### `/supabase/` - Infrastructure & Migrations
**Purpose**: Supabase CLI project configuration and database schema management
```
supabase/
├── config.toml                    # Supabase project configuration
└── migrations/                    # Database schema migrations
    ├── 20240522000000_update_users_table.sql
    ├── 20240523000000_create_notification_settings.sql
    ├── 20240524000000_add_avatar_url.sql
    ├── 20240601000000_update_kyc_table.sql
    ├── 20250125000000_create_chat_system.sql
    ├── 20250126000000_create_admin_system.sql
    ├── 20250523_defi_staking.sql
    ├── 20250523_generated_wallets.sql
    ├── 20250523_transaction_categories.sql
    ├── 20250523_wallet_connections.sql
    ├── 20250523_wallet_preferences.sql
    └── 20250523_wallet_settings.sql
```

### `/src/integrations/supabase/` - Application Integration
**Purpose**: Runtime Supabase client and TypeScript type definitions
```
src/integrations/supabase/
├── client.ts                      # Supabase client configuration
└── types.ts                       # Auto-generated TypeScript types
```

## 🗄️ Database Schema

### Core Tables

#### **users**
- **Purpose**: Main user profiles and authentication data
- **Key Fields**: `id`, `email`, `full_name`, `phone`, `status`, `avatar_url`
- **Features**: Profile information, user status management

#### **admin_users**
- **Purpose**: Admin user management with role-based access control
- **Key Fields**: `user_id`, `role`, `permissions`, `is_active`
- **Roles**: `super_admin`, `user_manager`, `transaction_manager`, `report_viewer`

#### **wallets** (Enhanced Unified Table)
- **Purpose**: Unified wallet management system for all wallet types
- **Key Fields**: `user_id`, `wallet_name`, `wallet_type`, `wallet_address`, `network`, `provider`
- **Enhanced Features**:
  - Unified storage for all wallet types (hardware, software, generated)
  - Network-specific addresses and keys
  - Connection method tracking
  - Device information storage
  - Source table tracking for data migration
- **Security**: Encrypted seed phrases and private keys with JSON storage

#### **generated_wallets** (Enhanced)
- **Purpose**: App-generated wallets with enhanced security features
- **Key Fields**: `user_id`, `name`, `encrypted_seed_phrase`, `addresses`, `private_keys`, `public_keys`
- **Enhanced Features**:
  - Network-specific wallet addresses
  - Separate storage for private/public keys
  - Active status tracking
  - Enhanced JSON structure for multi-network support
- **Security**: Enhanced encryption with network-specific key management

#### **transactions**
- **Purpose**: Transaction history and management
- **Key Fields**: `user_id`, `wallet_id`, `transaction_type`, `amount`, `status`
- **Types**: Send, receive, swap, stake

#### **tokens**
- **Purpose**: Supported cryptocurrency tokens
- **Key Fields**: `symbol`, `name`, `logo`, `decimals`, `price`
- **Features**: Real-time price tracking

### Supporting Tables

#### **kyc** (Enhanced)
- **Purpose**: Comprehensive Know Your Customer verification system
- **Key Fields**: `user_id`, `first_name`, `last_name`, `date_of_birth`, `status`, `document_type`
- **Enhanced Features**:
  - Complete personal information collection
  - Multiple document upload support (front, back, selfie)
  - Address verification with city, state, postal code
  - Review workflow with admin notes
  - Audit trail with submission and review dates
- **Statuses**: pending, approved, rejected, under_review

#### **notification_settings**
- **Purpose**: User notification preferences
- **Key Fields**: `user_id`, `price_alerts`, `trade_confirmations`, `security_alerts`

#### **wallet_connections** (New)
- **Purpose**: Track external wallet connections and their status
- **Key Fields**: `user_id`, `wallet_type`, `wallet_address`, `network`, `provider`
- **Features**:
  - Connection method tracking (WalletConnect, direct, etc.)
  - Device information storage
  - Last connected timestamp
  - Active status management

#### **wallet_preferences** (New)
- **Purpose**: User-specific wallet preferences and settings
- **Key Fields**: `user_id`, `default_network`, `preferred_currency`, `auto_lock_timeout`
- **Features**:
  - Default network selection
  - Currency display preferences
  - Security settings (auto-lock, biometric)
  - UI preferences (show balances, notifications)

#### **wallet_settings** (New)
- **Purpose**: Individual wallet customization settings
- **Key Fields**: `user_id`, `wallet_id`, `custom_name`, `is_hidden`, `sort_order`
- **Features**:
  - Custom wallet naming
  - Wallet visibility control
  - Display order management

#### **transaction_categories** (New)
- **Purpose**: Categorization system for transactions
- **Key Fields**: `name`, `description`, `color`, `icon`, `is_system`
- **Features**:
  - System and user-defined categories
  - Visual customization (color, icon)
  - Category management

#### **wallet_balances**
- **Purpose**: Token balances for user wallets
- **Key Fields**: `user_id`, `wallet_id`, `token_id`, `balance`

#### **liquidity_positions**
- **Purpose**: DeFi liquidity pool positions
- **Key Fields**: `user_id`, `token_a_id`, `token_b_id`, `pool_share`

### Admin & Audit Tables

#### **admin_activity_logs**
- **Purpose**: Audit trail for admin actions
- **Key Fields**: `admin_user_id`, `action`, `target_type`, `details`

#### **user_login_history**
- **Purpose**: User login tracking and security
- **Key Fields**: `user_id`, `login_time`, `ip_address`, `device_info`

#### **user_status_changes**
- **Purpose**: Track user status modifications by admins
- **Key Fields**: `user_id`, `admin_user_id`, `old_status`, `new_status`

## 🔧 Supabase Client Configuration

### Authentication Settings
```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

### Project Configuration
- **Project ID**: `besdtjhbciefgnokaasa`
- **URL**: `https://besdtjhbciefgnokaasa.supabase.co`
- **Environment**: Production-ready configuration

## 🔐 Security Features

### Row Level Security (RLS)
- **Enabled**: All tables have RLS policies
- **User Data**: Users can only access their own data
- **Admin Access**: Role-based access control for admin operations

### Unique Constraints for Data Integrity
- **`users.email`**: Prevents duplicate email addresses
- **`users.auth_id`**: Ensures unique authentication identifiers
- **`admin_users.user_id`**: One admin record per user
- **`generated_wallets.user_id`**: One generated wallet per user (configurable)
- **`wallets.wallet_address + network`**: Prevents duplicate wallet addresses on same network
- **`wallets.source_table + source_id`**: Ensures unique source references in unified table
- **`wallet_connections.user_id + wallet_address + network`**: Prevents duplicate connections
- **`wallet_preferences.user_id`**: One preference record per user
- **`wallet_settings.user_id + wallet_id`**: One setting record per wallet per user

### Admin Permissions
- **Hierarchy**: Super Admin > User Manager > Transaction Manager > Report Viewer
- **Audit Trail**: All admin actions are logged
- **Session Management**: Secure admin session handling

## 📱 Application Integration

### Context Providers
- **AuthContext**: User authentication state
- **AdminContext**: Admin user permissions and state
- **KYCContext**: KYC verification workflow
- **TestnetContext**: Testnet wallet management

### Service Layer
- **adminService.ts**: Admin operations (user management, analytics)
- **testnetDatabaseService.ts**: Testnet wallet operations
- **walletGenerationService.ts**: Wallet creation and management

## 🚀 Usage Examples

### Basic Database Query
```typescript
import { supabase } from '@/integrations/supabase/client';

// Fetch user data
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

### Admin Operations
```typescript
import { getUsers, updateUserStatus } from '@/services/adminService';

// Get paginated users
const { users, total } = await getUsers({ status: 'active' }, { page: 1, limit: 20 });

// Update user status
await updateUserStatus(userId, 'suspended', 'Policy violation');
```

## 🔄 Migration Management

### Recent Migrations
- **20250127000001**: User table constraints and email validation
- **20250127000002**: Unique constraints for data integrity
- **20250127000003**: Data cleanup for constraint violations

### Running Migrations
```bash
# Apply all pending migrations
supabase db push

# Reset database (development only)
supabase db reset
```

### Creating New Migrations
```bash
# Create new migration file
supabase migration new migration_name
```

### Constraint Migration Details
The unique constraint migrations include:
- **Duplicate Detection**: Functions to identify constraint violations
- **Data Cleanup**: Automated resolution of duplicate entries
- **Safe Application**: Constraints applied only after data cleanup
- **Verification**: Post-migration validation of constraint success

## 📊 Type Safety

### Generated Types
- **Auto-generated**: TypeScript types from database schema
- **Type-safe**: All database operations are fully typed
- **IntelliSense**: Full IDE support for database operations

### Usage
```typescript
import { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
```

## ✅ Verification

### Database Health Check
- ✅ All migrations applied successfully
- ✅ RLS policies configured correctly
- ✅ Admin system functional
- ✅ Type definitions up-to-date
- ✅ Application integration working

### No Redundancy
- ✅ No duplicate configurations
- ✅ Clear separation of concerns
- ✅ Standard Supabase project structure
- ✅ All files actively used

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Admin Implementation Plan](./ADMIN_IMPLEMENTATION_PLAN.md)
- [Database Migration Files](./supabase/migrations/)
- [Admin Setup Scripts](./scripts/)

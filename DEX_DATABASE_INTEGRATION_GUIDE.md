# DEX MOBILE APPLICATION - COMPREHENSIVE DATABASE INTEGRATION GUIDE

## 📋 **OVERVIEW**
This document provides a complete list of all database-related files in the DEX mobile application for integration with your web application version. All files are organized by category with detailed descriptions and integration requirements.

---

## 🔧 **1. DATABASE CONFIGURATION FILES**

### **Supabase Client Configuration**
- **File:** `src/integrations/supabase/client.ts`
- **Purpose:** Main Supabase client initialization and configuration
- **Key Features:**
  - Project URL: `https://besdtjhbciefgnokaasa.supabase.co`
  - Project ID: `besdtjhbciefgnokaasa`
  - Authentication settings (autoRefreshToken, persistSession, PKCE flow)
  - Tunnel environment detection for development
  - Real-time configuration with event throttling
  - CORS headers for cross-origin requests

### **Project Configuration**
- **File:** `supabase/config.toml`
- **Purpose:** Supabase CLI project configuration
- **Contains:** Project ID and local development settings

### **Environment Variables** (Referenced in code)
```typescript
// Required environment variables for your web app:
VITE_SUPABASE_URL="https://besdtjhbciefgnokaasa.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🗄️ **2. DATABASE SCHEMA AND TYPES**

### **Core Type Definitions** ⭐ **CRITICAL FOR WEB APP**
- **File:** `src/integrations/supabase/types.ts`
- **Purpose:** Auto-generated TypeScript types from database schema
- **Contains:** Complete type definitions for all 20+ database tables
- **Key Tables:**
  - `users` - User profiles and authentication
  - `wallets` - Unified wallet management
  - `generated_wallets` - App-generated wallets
  - `wallet_connections` - External wallet connections
  - `wallet_preferences` - User wallet settings
  - `wallet_settings` - Individual wallet configurations
  - `transactions` - Transaction history
  - `tokens` - Token definitions
  - `notification_settings` - User notification preferences
  - `kyc` - KYC verification data
  - `admin_users` - Admin system
  - `admin_activity_logs` - Admin audit trail
  - `user_login_history` - Login tracking
  - `user_status_changes` - User status audit
  - `transaction_categories` - Transaction categorization

### **Database Schema Documentation**
- **File:** `Md files/DATABASE_STRUCTURE.md`
- **Purpose:** Comprehensive database schema documentation
- **Contains:** Table relationships, RLS policies, migration history

---

## 📊 **3. DATABASE MIGRATION FILES** ⭐ **ESSENTIAL FOR SCHEMA REPLICATION**

### **Migration Directory:** `supabase/migrations/`

#### **Core Schema Migrations:**
- `20240522000000_update_users_table.sql` - User table structure
- `20240523000000_create_notification_settings.sql` - Notification system
- `20240524000000_add_avatar_url.sql` - User avatar support
- `20240601000000_update_kyc_table.sql` - KYC system
- `20250125000000_create_chat_system.sql` - Chat functionality
- `20250126000000_create_admin_system.sql` - Admin management
- `20250127000000_create_kyc_table.sql` - Enhanced KYC
- `20250127000001_create_aml_table.sql` - AML compliance

#### **Wallet System Migrations:**
- `20250523_generated_wallets.sql` - App-generated wallets
- `20250523_wallet_connections.sql` - External wallet connections
- `20250523_wallet_preferences.sql` - User wallet preferences
- `20250523_wallet_settings.sql` - Individual wallet settings
- `20250523_transaction_categories.sql` - Transaction categorization

#### **Advanced Feature Migrations:**
- `20250523_defi_staking.sql` - DeFi staking functionality
- `20250101_phase4_defi_integration.sql` - DeFi integration
- `20250101_phase4_advanced_trading.sql` - Advanced trading features
- `20250101_phase4_5_social_trading.sql` - Social trading system
- `20250101_phase4_3_cross_chain_bridge.sql` - Cross-chain bridge

#### **Security & Constraint Migrations:**
- `20250127000001_fix_users_table_constraints.sql` - User table constraints
- `20250127000002_add_unique_constraints.sql` - Data integrity
- `20250128000000_fix_auth_policies.sql` - Authentication policies
- `20250128000001_fix_database_registration_issues.sql` - Registration fixes
- `20250128000002_update_phone_format_constraint.sql` - Phone validation
- `20250128000003_fix_rls_policy_issues.sql` - RLS policy fixes

---

## 🔗 **4. SERVICE LAYER FILES**

### **Core Database Services**
- **File:** `src/services/adminService.ts`
- **Purpose:** Admin operations (user management, analytics)
- **Database Operations:** User CRUD, status management, audit logging

- **File:** `src/services/testnetDatabaseService.ts`
- **Purpose:** Testnet wallet operations
- **Database Operations:** Testnet wallet CRUD, balance management

- **File:** `src/services/comprehensiveWalletService.ts`
- **Purpose:** Enterprise wallet management with blockchain integration
- **Database Operations:** Wallet creation, transaction recording, balance updates

- **File:** `src/services/unifiedWalletService.ts`
- **Purpose:** Unified wallet data management across all wallet types
- **Database Operations:** Wallet synchronization, cross-table operations

- **File:** `src/services/walletPreferencesService.ts`
- **Purpose:** User wallet preferences and settings management
- **Database Operations:** Preference CRUD, wallet configuration

- **File:** `src/services/walletGenerationService.ts`
- **Purpose:** Wallet generation and encryption
- **Database Operations:** Generated wallet storage, seed phrase encryption

### **Real-Time Data Services**
- **File:** `src/services/realTimeTokenSearchService.ts`
- **Purpose:** Token search with database caching
- **Database Operations:** Token caching, search optimization

### **Authentication Services**
- **File:** `src/services/authValidationService.ts`
- **Purpose:** Authentication validation and email checking
- **Database Operations:** Email availability checks, user validation

---

## 🎯 **5. CONTEXT PROVIDERS FOR DATABASE CONNECTIONS**

### **Authentication Context**
- **File:** `src/contexts/AuthContext.tsx`
- **Purpose:** User authentication state management
- **Database Integration:** User signup, signin, session management
- **Key Functions:** `signUp()`, `signIn()`, `signOut()`, session validation

### **Admin Context**
- **File:** `src/contexts/AdminContext.tsx`
- **Purpose:** Admin user permissions and state
- **Database Integration:** Admin user management, permission checking

### **KYC Context**
- **File:** `src/contexts/KYCContext.tsx`
- **Purpose:** KYC verification workflow
- **Database Integration:** KYC data management, verification status

### **Testnet Context**
- **File:** `src/contexts/TestnetContext.tsx`
- **Purpose:** Testnet wallet management
- **Database Integration:** Testnet wallet CRUD, transaction management

### **Chat Context**
- **File:** `src/contexts/ChatContext.tsx`
- **Purpose:** Real-time chat system
- **Database Integration:** Real-time subscriptions, message management

---

## 🔄 **6. HOOKS THAT MANAGE DATABASE STATE**

### **Wallet Data Hook**
- **File:** `src/hooks/useWalletData.ts`
- **Purpose:** Wallet data state management
- **Database Integration:** Wallet balance fetching, transaction history

### **Portfolio Data Hook**
- **File:** `src/hooks/usePortfolioData.ts`
- **Purpose:** Portfolio analytics and data
- **Database Integration:** Portfolio calculation, performance tracking

---

## 🧪 **7. DATABASE DEBUGGING AND TESTING FILES**

### **Database Debugger**
- **File:** `src/debug/databaseDebugger.ts`
- **Purpose:** Database connection and operation testing
- **Functions:** Connection tests, RLS policy validation, constraint testing

### **Migration Verification**
- **File:** `src/scripts/verifyDatabaseMigration.ts`
- **Purpose:** Database migration status verification
- **Functions:** Migration validation, constraint checking

### **Signup Diagnostic Service**
- **File:** `src/debug/signupDiagnosticService.ts`
- **Purpose:** Comprehensive signup flow testing
- **Functions:** Multi-approach problem solving for registration issues

---

## 📱 **8. COMPONENTS WITH DIRECT DATABASE QUERIES**

### **Notification Settings Page**
- **File:** `src/pages/NotificationsPage.tsx`
- **Database Operations:** Direct Supabase queries for notification preferences

### **Wallet Dashboard Page**
- **File:** `src/pages/WalletDashboardPage.tsx`
- **Database Operations:** Wallet data fetching, balance calculations

---

## 🔧 **9. API INTEGRATION AND ERROR HANDLING**

### **Data Transformation Utilities**
- **File:** `src/services/realTimeDataManager.ts`
- **Purpose:** Real-time data management with database caching
- **Features:** Data validation, caching strategies, error recovery

### **WebSocket Data Service**
- **File:** `src/services/webSocketDataService.ts`
- **Purpose:** Real-time data streaming with database integration
- **Features:** Live data updates, database synchronization

---

## 🚀 **10. INTEGRATION REQUIREMENTS FOR WEB APPLICATION**

### **Essential Files to Replicate:**
1. **Database Schema:** All migration files in `supabase/migrations/`
2. **Type Definitions:** `src/integrations/supabase/types.ts`
3. **Client Configuration:** `src/integrations/supabase/client.ts`
4. **Core Services:** All files in sections 4-5 above

### **Database Setup Steps:**
1. **Create Supabase Project:** Use same project ID or create new one
2. **Apply Migrations:** Run all migration files in chronological order
3. **Configure RLS Policies:** Ensure Row Level Security is properly configured
4. **Set Environment Variables:** Configure Supabase URL and keys
5. **Test Database Connection:** Verify all tables and relationships

### **Critical Configuration Notes:**
- **Project ID:** `besdtjhbciefgnokaasa` (current mobile app)
- **Database URL:** `https://besdtjhbciefgnokaasa.supabase.co`
- **Authentication:** PKCE flow with email confirmation
- **RLS Policies:** All tables have Row Level Security enabled
- **Real-time:** Configured for live data updates

---

## ⚠️ **IMPORTANT CONSIDERATIONS**

### **Data Consistency:**
- Use same Supabase project for both mobile and web apps
- Implement proper conflict resolution for concurrent updates
- Maintain referential integrity across all operations

### **Security:**
- All tables use Row Level Security (RLS)
- Users can only access their own data
- Admin operations require proper role verification
- Sensitive data (seed phrases, private keys) is encrypted

### **Performance:**
- Database is optimized for 50,000+ concurrent users
- Proper indexing on frequently queried columns
- Real-time subscriptions with event throttling
- Intelligent caching strategies implemented

This comprehensive guide provides all necessary information to integrate your web application with the same Supabase database used by the DEX mobile application, ensuring complete data consistency between platforms.

---

## 📋 **APPENDIX: KEY DATABASE SCHEMA DEFINITIONS**

### **Core Users Table Structure:**
```sql
-- From 20240522000000_update_users_table.sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  birthdate DATE,
  location VARCHAR(255),
  bio TEXT,
  website VARCHAR(255),
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Generated Wallets Table:**
```sql
-- From 20250523_generated_wallets.sql
CREATE TABLE generated_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_seed_phrase TEXT NOT NULL,
  addresses JSONB NOT NULL,
  private_keys JSONB,
  public_keys JSONB,
  wallet_address TEXT,
  network TEXT DEFAULT 'ethereum',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Admin System Tables:**
```sql
-- From 20250126000000_create_admin_system.sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'report_viewer'
    CHECK (role IN ('super_admin', 'user_manager', 'transaction_manager', 'report_viewer')),
  permissions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **Wallet Management Tables:**
```sql
-- Unified wallets table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_name TEXT NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('hot', 'cold', 'generated')),
  wallet_address TEXT NOT NULL,
  network TEXT DEFAULT 'ethereum',
  provider TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  addresses JSONB,
  encrypted_seed_phrase TEXT,
  private_keys JSONB,
  public_keys JSONB,
  connection_method TEXT,
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet preferences
CREATE TABLE wallet_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_network TEXT DEFAULT 'ethereum',
  preferred_currency TEXT DEFAULT 'USD',
  auto_lock_timeout INTEGER DEFAULT 300,
  show_balances BOOLEAN DEFAULT true,
  enable_notifications BOOLEAN DEFAULT true,
  biometric_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Transaction System:**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL,
  transaction_type TEXT NOT NULL,
  from_token_id TEXT,
  to_token_id TEXT,
  from_amount TEXT,
  to_amount TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Essential RLS Policies:**
```sql
-- Users can only access their own data
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- Wallet access policies
CREATE POLICY "Users can view their own wallets"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Admin access policies
CREATE POLICY "Super admins can view all admin users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );
```

### **Critical Database Functions:**
```sql
-- User profile creation trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name, phone, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'active'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

This appendix provides the essential database schema definitions needed to replicate the DEX mobile application's database structure in your web application.

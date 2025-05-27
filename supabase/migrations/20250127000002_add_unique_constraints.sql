-- =====================================================
-- Add Missing Unique Constraints for Data Integrity
-- Ensures no duplicate entries in critical identifier columns
-- =====================================================

-- 1. Add unique constraint on generated_wallets.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'generated_wallets' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'generated_wallets_user_id_unique'
  ) THEN
    ALTER TABLE public.generated_wallets ADD CONSTRAINT generated_wallets_user_id_unique UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on generated_wallets.user_id';
  ELSE
    RAISE NOTICE 'Unique constraint on generated_wallets.user_id already exists';
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Cannot add unique constraint on generated_wallets.user_id due to existing duplicates';
    RAISE NOTICE 'Please resolve duplicate user_id entries before applying this constraint';
END
$$;

-- 2. Add unique constraint on wallets table for wallet_address + network combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'wallets' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'wallets_address_network_unique'
  ) THEN
    ALTER TABLE public.wallets ADD CONSTRAINT wallets_address_network_unique UNIQUE (wallet_address, network);
    RAISE NOTICE 'Added unique constraint on wallets.wallet_address + network';
  ELSE
    RAISE NOTICE 'Unique constraint on wallets.wallet_address + network already exists';
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Cannot add unique constraint on wallets.wallet_address + network due to existing duplicates';
    RAISE NOTICE 'Please resolve duplicate wallet_address + network combinations before applying this constraint';
END
$$;

-- 3. Add unique constraint on wallets table for source_table + source_id combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'wallets' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'wallets_source_unique'
  ) THEN
    ALTER TABLE public.wallets ADD CONSTRAINT wallets_source_unique UNIQUE (source_table, source_id);
    RAISE NOTICE 'Added unique constraint on wallets.source_table + source_id';
  ELSE
    RAISE NOTICE 'Unique constraint on wallets.source_table + source_id already exists';
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Cannot add unique constraint on wallets.source_table + source_id due to existing duplicates';
    RAISE NOTICE 'Please resolve duplicate source references before applying this constraint';
END
$$;

-- 4. Add unique constraint on wallet_connections for user_id + address + chain_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'wallet_connections' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'wallet_connections_user_address_chain_id_unique'
  ) THEN
    ALTER TABLE public.wallet_connections ADD CONSTRAINT wallet_connections_user_address_chain_id_unique 
    UNIQUE (user_id, address, chain_id);
    RAISE NOTICE 'Added unique constraint on wallet_connections.user_id + address + chain_id';
  ELSE
    RAISE NOTICE 'Unique constraint on wallet_connections.user_id + address + chain_id already exists';
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Cannot add unique constraint on wallet_connections due to existing duplicates';
    RAISE NOTICE 'Please resolve duplicate wallet connections before applying this constraint';
END
$$;

-- 5. Add unique constraint on wallet_preferences.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'wallet_preferences' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'wallet_preferences_user_id_unique'
  ) THEN
    ALTER TABLE public.wallet_preferences ADD CONSTRAINT wallet_preferences_user_id_unique UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on wallet_preferences.user_id';
  ELSE
    RAISE NOTICE 'Unique constraint on wallet_preferences.user_id already exists';
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Cannot add unique constraint on wallet_preferences.user_id due to existing duplicates';
    RAISE NOTICE 'Please resolve duplicate user preferences before applying this constraint';
END
$$;

-- 6. Add unique constraint on wallet_settings for user_id + id combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'wallet_settings' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'wallet_settings_user_id_unique'
  ) THEN
    ALTER TABLE public.wallet_settings ADD CONSTRAINT wallet_settings_user_wallet_unique UNIQUE (user_id, id);
    RAISE NOTICE 'Added unique constraint on wallet_settings.user_id + id';
  ELSE
    RAISE NOTICE 'Unique constraint on wallet_settings.user_id + id already exists';
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Cannot add unique constraint on wallet_settings due to existing duplicates';
    RAISE NOTICE 'Please resolve duplicate wallet settings before applying this constraint';
END
$$;

-- 7. Create indexes for better performance on new unique constraints
CREATE INDEX IF NOT EXISTS generated_wallets_user_id_unique_idx ON public.generated_wallets(user_id);
CREATE INDEX IF NOT EXISTS wallets_address_network_idx ON public.wallets(wallet_address, network);
CREATE INDEX IF NOT EXISTS wallets_source_idx ON public.wallets(source_table, source_id);
CREATE INDEX IF NOT EXISTS wallet_connections_user_address_chain_id_idx ON public.wallet_connections(user_id, address, chain_id);
CREATE INDEX IF NOT EXISTS wallet_preferences_user_id_idx ON public.wallet_preferences(user_id);
CREATE INDEX IF NOT EXISTS wallet_settings_user_wallet_idx ON public.wallet_settings(user_id, id);

-- 8. Create function to check for constraint violations before they occur
CREATE OR REPLACE FUNCTION check_wallet_constraints()
RETURNS TABLE(
  table_name TEXT,
  constraint_type TEXT,
  violation_count BIGINT,
  sample_violations TEXT
) AS $$
BEGIN
  -- Check for duplicate user_id in generated_wallets
  RETURN QUERY
  SELECT 
    'generated_wallets'::TEXT,
    'user_id_duplicate'::TEXT,
    COUNT(*)::BIGINT,
    string_agg(DISTINCT user_id::TEXT, ', ')::TEXT
  FROM (
    SELECT user_id, COUNT(*) as cnt
    FROM public.generated_wallets
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;

  -- Check for duplicate wallet_address + network in wallets
  RETURN QUERY
  SELECT 
    'wallets'::TEXT,
    'address_network_duplicate'::TEXT,
    COUNT(*)::BIGINT,
    string_agg(DISTINCT wallet_address || ' (' || network || ')', ', ')::TEXT
  FROM (
    SELECT wallet_address, network, COUNT(*) as cnt
    FROM public.wallets
    GROUP BY wallet_address, network
    HAVING COUNT(*) > 1
  ) duplicates;

  -- Check for duplicate source references in wallets
  RETURN QUERY
  SELECT 
    'wallets'::TEXT,
    'source_duplicate'::TEXT,
    COUNT(*)::BIGINT,
    string_agg(DISTINCT source_table || ':' || source_id::TEXT, ', ')::TEXT
  FROM (
    SELECT source_table, source_id, COUNT(*) as cnt
    FROM public.wallets
    GROUP BY source_table, source_id
    HAVING COUNT(*) > 1
  ) duplicates;
END;
$$ LANGUAGE plpgsql;

-- 9. Verify constraints were created successfully
SELECT 
  'Constraint Verification' as check_type,
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'admin_users', 'generated_wallets', 'wallets', 'wallet_connections', 'wallet_preferences', 'wallet_settings')
  AND constraint_type = 'UNIQUE'
ORDER BY table_name, constraint_name;

-- 10. Check for any constraint violations
SELECT * FROM check_wallet_constraints();
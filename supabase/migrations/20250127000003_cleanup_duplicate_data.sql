-- =====================================================
-- Data Cleanup for Unique Constraints
-- Resolves duplicate data that might prevent unique constraints
-- =====================================================
-- source: dashboard
-- user: 3028ccc4-beae-49b2-826c-315556178e49
-- date: 2025-05-27T19:16:29.995Z

-- 1. Function to resolve duplicate generated_wallets by user_id
CREATE OR REPLACE FUNCTION resolve_duplicate_generated_wallets()
RETURNS void AS $$
DECLARE
  duplicate_record RECORD;
  keep_id UUID;
  delete_ids UUID[];
BEGIN
  FOR duplicate_record IN 
    SELECT user_id, array_agg(id ORDER BY created_at ASC) AS wallet_ids, COUNT(*) AS count
    FROM public.generated_wallets
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    keep_id := duplicate_record.wallet_ids[1];
    delete_ids := duplicate_record.wallet_ids[2:];
    RAISE NOTICE 'Resolving % duplicate generated_wallets for user_id: %, keeping wallet: %, removing: %', 
      duplicate_record.count - 1, duplicate_record.user_id, keep_id, delete_ids;
    UPDATE public.wallets 
    SET source_id = keep_id
    WHERE source_table = 'generated_wallets' 
    AND source_id = ANY(delete_ids);
    DELETE FROM public.generated_wallets 
    WHERE id = ANY(delete_ids);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to resolve duplicate wallet addresses in wallets table
CREATE OR REPLACE FUNCTION resolve_duplicate_wallet_addresses()
RETURNS void AS $$
DECLARE
  duplicate_record RECORD;
  keep_id UUID;
  delete_ids UUID[];
BEGIN
  FOR duplicate_record IN 
    SELECT wallet_address, network, array_agg(id ORDER BY created_at ASC) AS wallet_ids, COUNT(*) AS count
    FROM public.wallets
    WHERE wallet_address IS NOT NULL
    GROUP BY wallet_address, network
    HAVING COUNT(*) > 1
  LOOP
    keep_id := duplicate_record.wallet_ids[1];
    delete_ids := duplicate_record.wallet_ids[2:];
    RAISE NOTICE 'Resolving % duplicate wallet addresses for %@%, keeping wallet: %, removing: %', 
      duplicate_record.count - 1, duplicate_record.wallet_address, duplicate_record.network, keep_id, delete_ids;
    UPDATE public.wallets 
    SET is_active = false, 
        updated_at = NOW(),
        wallet_name = wallet_name || ' (DUPLICATE_REMOVED_' || id::text || ')'
    WHERE id = ANY(delete_ids);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to resolve duplicate source references in wallets table
CREATE OR REPLACE FUNCTION resolve_duplicate_source_references()
RETURNS void AS $$
DECLARE
  duplicate_record RECORD;
  keep_id UUID;
  delete_ids UUID[];
BEGIN
  FOR duplicate_record IN 
    SELECT source_table, source_id, array_agg(id ORDER BY created_at ASC) AS wallet_ids, COUNT(*) AS count
    FROM public.wallets
    GROUP BY source_table, source_id
    HAVING COUNT(*) > 1
  LOOP
    keep_id := duplicate_record.wallet_ids[1];
    delete_ids := duplicate_record.wallet_ids[2:];
    RAISE NOTICE 'Resolving % duplicate source references for %:%, keeping wallet: %, removing: %', 
      duplicate_record.count - 1, duplicate_record.source_table, duplicate_record.source_id, keep_id, delete_ids;
    UPDATE public.wallets 
    SET is_active = false, 
        updated_at = NOW(),
        wallet_name = wallet_name || ' (DUPLICATE_SOURCE_' || id::text || ')'
    WHERE id = ANY(delete_ids);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to resolve duplicate wallet connections
CREATE OR REPLACE FUNCTION resolve_duplicate_wallet_connections()
RETURNS void AS $$
DECLARE
  duplicate_record RECORD;
  keep_id UUID;
  delete_ids UUID[];
BEGIN
  FOR duplicate_record IN 
    SELECT user_id, address, network, array_agg(id ORDER BY created_at ASC) AS connection_ids, COUNT(*) AS count
    FROM public.wallet_connections
    WHERE address IS NOT NULL
    GROUP BY user_id, address, network
    HAVING COUNT(*) > 1
  LOOP
    keep_id := duplicate_record.connection_ids[1];
    delete_ids := duplicate_record.connection_ids[2:];
    RAISE NOTICE 'Resolving % duplicate wallet connections for user % with address %@%, keeping: %, removing: %', 
      duplicate_record.count - 1, duplicate_record.user_id, duplicate_record.address, 
      duplicate_record.network, keep_id, delete_ids;
    UPDATE public.wallets 
    SET source_id = keep_id
    WHERE source_table = 'wallet_connections' 
    AND source_id = ANY(delete_ids);
    DELETE FROM public.wallet_connections 
    WHERE id = ANY(delete_ids);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to resolve duplicate wallet preferences
CREATE OR REPLACE FUNCTION resolve_duplicate_wallet_preferences()
RETURNS void AS $$
DECLARE
  duplicate_record RECORD;
  keep_id UUID;
  delete_ids UUID[];
BEGIN
  FOR duplicate_record IN 
    SELECT user_id, array_agg(id ORDER BY created_at ASC) AS pref_ids, COUNT(*) AS count
    FROM public.wallet_preferences
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    keep_id := duplicate_record.pref_ids[1];
    delete_ids := duplicate_record.pref_ids[2:];
    RAISE NOTICE 'Resolving % duplicate wallet preferences for user_id: %, keeping: %, removing: %', 
      duplicate_record.count - 1, duplicate_record.user_id, keep_id, delete_ids;
    DELETE FROM public.wallet_preferences 
    WHERE id = ANY(delete_ids);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to resolve duplicate wallet settings
CREATE OR REPLACE FUNCTION resolve_duplicate_wallet_settings()
RETURNS void AS $$
DECLARE
  duplicate_record RECORD;
  keep_id UUID;
  delete_ids UUID[];
BEGIN
  FOR duplicate_record IN 
    SELECT user_id, wallet_id, array_agg(id ORDER BY created_at ASC) AS setting_ids, COUNT(*) AS count
    FROM public.wallet_settings
    GROUP BY user_id, wallet_id
    HAVING COUNT(*) > 1
  LOOP
    keep_id := duplicate_record.setting_ids[1];
    delete_ids := duplicate_record.setting_ids[2:];
    RAISE NOTICE 'Resolving % duplicate wallet settings for user % + wallet %, keeping: %, removing: %', 
      duplicate_record.count - 1, duplicate_record.user_id, duplicate_record.wallet_id, keep_id, delete_ids;
    DELETE FROM public.wallet_settings 
    WHERE id = ANY(delete_ids);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Execute cleanup functions in order
DO $$
BEGIN
  -- Clean up generated_wallets duplicates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'generated_wallets') THEN
    PERFORM resolve_duplicate_generated_wallets();
    RAISE NOTICE 'Completed cleanup of generated_wallets duplicates';
  END IF;

  -- Clean up wallet address duplicates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
    PERFORM resolve_duplicate_wallet_addresses();
    RAISE NOTICE 'Completed cleanup of wallet address duplicates';
  END IF;

  -- Clean up source reference duplicates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
    PERFORM resolve_duplicate_source_references();
    RAISE NOTICE 'Completed cleanup of source reference duplicates';
  END IF;

  -- Clean up wallet connections duplicates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_connections') THEN
    PERFORM resolve_duplicate_wallet_connections();
    RAISE NOTICE 'Completed cleanup of wallet_connections duplicates';
  END IF;

  -- Clean up wallet preferences duplicates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_preferences') THEN
    PERFORM resolve_duplicate_wallet_preferences();
    RAISE NOTICE 'Completed cleanup of wallet_preferences duplicates';
  END IF;

  -- Clean up wallet settings duplicates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_settings') THEN
    PERFORM resolve_duplicate_wallet_settings();
    RAISE NOTICE 'Completed cleanup of wallet_settings duplicates';
  END IF;

END $$;
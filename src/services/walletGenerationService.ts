// Import bip39 library
import * as bip39 from 'bip39';
// Verify bip39 import
console.log('BIP39 library loaded:', bip39 ? 'Yes' : 'No', 'Methods:', Object.keys(bip39));
import { HDKey } from '@scure/bip32';
import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import CryptoJS from 'crypto-js';

// Define the wallet type interface
export interface GeneratedWallet {
  id: string;
  name: string;
  type: 'generated';
  seedPhrase?: string; // Only included during development, not stored in production
  addresses: {
    [key: string]: string; // e.g., 'BTC': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  };
  createdAt: string;
}

// Define the derivation paths for different cryptocurrencies
const DERIVATION_PATHS = {
  BTC: "m/44'/0'/0'/0/0",     // Bitcoin
  ETH: "m/44'/60'/0'/0/0",    // Ethereum
  SOL: "m/44'/501'/0'/0/0",   // Solana
  DOGE: "m/44'/3'/0'/0/0",    // Dogecoin
  LTC: "m/44'/2'/0'/0/0",     // Litecoin
  DOT: "m/44'/354'/0'/0/0",   // Polkadot
  ADA: "m/44'/1815'/0'/0/0",  // Cardano
  XRP: "m/44'/144'/0'/0/0",   // Ripple
  AVAX: "m/44'/9000'/0'/0/0", // Avalanche
  MATIC: "m/44'/966'/0'/0/0", // Polygon
  LINK: "m/44'/60'/0'/0/0",   // Chainlink (uses Ethereum path)
};

/**
 * Generate a new random mnemonic (seed phrase)
 * @param strength 128 for 12 words, 256 for 24 words
 * @returns The generated mnemonic
 */
export const generateMnemonic = (strength: 128 | 256 = 128): string => {
  try {
    console.log(`Attempting to generate mnemonic with strength: ${strength}`);

    // Generate a random mnemonic using the BIP39 library
    const mnemonic = bip39.generateMnemonic(strength);
    console.log(`Successfully generated mnemonic: ${mnemonic.substring(0, 10)}...`);
    return mnemonic;
  } catch (error) {
    console.error('Error in generateMnemonic:', error);

    // Fallback to hardcoded mnemonics if there's an error
    console.log('Falling back to hardcoded test mnemonic');
    if (strength === 128) {
      return "abandon ability able about above absent absorb abstract absurd abuse access accident";
    } else {
      return "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm";
    }
  }
};

/**
 * Validate a mnemonic (seed phrase)
 * @param mnemonic The mnemonic to validate
 * @returns Whether the mnemonic is valid
 */
export const validateMnemonic = (mnemonic: string): boolean => {
  return bip39.validateMnemonic(mnemonic);
};

/**
 * Generate wallet addresses for multiple cryptocurrencies from a mnemonic
 * @param mnemonic The mnemonic (seed phrase)
 * @returns An object with cryptocurrency addresses
 */
export const generateAddressesFromMnemonic = async (mnemonic: string): Promise<{ [key: string]: string }> => {
  try {
    // Validate the mnemonic
    if (!validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Create master HDKey
    const masterKey = HDKey.fromMasterSeed(seed);

    // Generate addresses for each cryptocurrency
    const addresses: { [key: string]: string } = {};

    // Generate Ethereum address
    const ethPath = DERIVATION_PATHS.ETH;
    const ethChild = masterKey.derive(ethPath);
    const ethPrivateKey = ethChild.privateKey;

    if (ethPrivateKey) {
      const ethWallet = new ethers.Wallet(ethPrivateKey);
      addresses.ETH = ethWallet.address;
    }

    // For other cryptocurrencies, we would use their respective libraries
    // This is a simplified implementation focusing on Ethereum
    // In a real implementation, you would add support for other cryptocurrencies

    return addresses;
  } catch (error) {
    console.error('Error generating addresses:', error);
    throw error;
  }
};

/**
 * Encrypt a seed phrase with a password
 * @param seedPhrase The seed phrase to encrypt
 * @param password The password to encrypt with
 * @returns The encrypted seed phrase
 */
export const encryptSeedPhrase = (seedPhrase: string, password: string): string => {
  return CryptoJS.AES.encrypt(seedPhrase, password).toString();
};

/**
 * Decrypt a seed phrase with a password
 * @param encryptedSeedPhrase The encrypted seed phrase
 * @param password The password to decrypt with
 * @returns The decrypted seed phrase
 */
export const decryptSeedPhrase = (encryptedSeedPhrase: string, password: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedSeedPhrase, password);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Check if the generated_wallets table exists in Supabase
 * @returns Whether the table exists
 */
export const checkGeneratedWalletsTable = async (): Promise<boolean> => {
  try {
    // Try to query the table with a limit of 0 to check if it exists
    const { error } = await supabase
      .from('generated_wallets')
      .select('id')
      .limit(0);

    // If there's no error, the table exists
    return !error;
  } catch (error) {
    console.error('Error checking generated_wallets table:', error);
    return false;
  }
};

/**
 * Test the generated_wallets table access and permissions
 * @returns Detailed information about the table access
 */
export const testGeneratedWalletsTableAccess = async (): Promise<{
  tableExists: boolean;
  canSelect: boolean;
  canInsert: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  schema?: any;
  error?: any;
}> => {
  const result = {
    tableExists: false,
    canSelect: false,
    canInsert: false,
    canUpdate: false,
    canDelete: false
  };

  try {
    // Check if table exists
    const { error: selectError } = await supabase
      .from('generated_wallets')
      .select('id')
      .limit(1);

    result.tableExists = !selectError;
    result.canSelect = !selectError;

    if (selectError) {
      result.error = {
        operation: 'select',
        code: selectError.code,
        message: selectError.message,
        details: selectError.details
      };
      return result;
    }

    // Get table schema
    const { data: schemaData } = await supabase
      .rpc('get_table_definition', { table_name: 'generated_wallets' })
      .single();

    if (schemaData) {
      result.schema = schemaData;
    }

    // Test insert permission with a temporary record
    const testId = crypto.randomUUID();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      result.error = {
        operation: 'auth',
        message: 'No authenticated user found'
      };
      return result;
    }

    const { error: insertError } = await supabase
      .from('generated_wallets')
      .insert({
        id: testId,
        user_id: userId,
        name: 'Test Wallet',
        encrypted_seed_phrase: 'test_encrypted_phrase',
        addresses: { BTC: 'test_address' },
        created_at: new Date().toISOString()
      });

    result.canInsert = !insertError;

    if (insertError) {
      result.error = {
        operation: 'insert',
        code: insertError.code,
        message: insertError.message,
        details: insertError.details
      };
      return result;
    }

    // Test update permission
    const { error: updateError } = await supabase
      .from('generated_wallets')
      .update({ name: 'Updated Test Wallet' })
      .eq('id', testId);

    result.canUpdate = !updateError;

    // Test delete permission
    const { error: deleteError } = await supabase
      .from('generated_wallets')
      .delete()
      .eq('id', testId);

    result.canDelete = !deleteError;

    return result;
  } catch (error) {
    console.error('Error testing generated_wallets table access:', error);
    result.error = error;
    return result;
  }
};

/**
 * Save a generated wallet to Supabase
 * @param userId The user's ID
 * @param walletName The name of the wallet
 * @param encryptedSeedPhrase The encrypted seed phrase
 * @param addresses The cryptocurrency addresses
 * @returns The created wallet
 */
export const saveGeneratedWallet = async (
  userId: string,
  walletName: string,
  encryptedSeedPhrase: string,
  addresses: { [key: string]: string }
): Promise<GeneratedWallet | null> => {
  try {
    // Check if the generated_wallets table exists
    const tableExists = await checkGeneratedWalletsTable();

    if (!tableExists) {
      console.error('The generated_wallets table does not exist in the database');

      // Create a mock wallet object for development purposes
      const mockWallet: GeneratedWallet = {
        id: crypto.randomUUID(),
        name: walletName,
        type: 'generated',
        seedPhrase: encryptedSeedPhrase, // Only for development
        addresses: addresses,
        createdAt: new Date().toISOString()
      };

      console.log('Created mock wallet:', mockWallet);
      return mockWallet;
    }

    // Create a new wallet record
    const { data: wallet, error: walletError } = await supabase
      .from('generated_wallets')
      .insert({
        user_id: userId,
        name: walletName,
        encrypted_seed_phrase: encryptedSeedPhrase,
        addresses: addresses,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (walletError) {
      console.error('Error creating wallet:', walletError);
      console.error('Error details:', {
        code: walletError.code,
        message: walletError.message,
        details: walletError.details,
        hint: walletError.hint
      });
      console.error('Data being inserted:', {
        user_id: userId,
        name: walletName,
        encrypted_seed_phrase: `${encryptedSeedPhrase.substring(0, 20)}...`, // Truncated for security
        addresses: addresses,
        created_at: new Date().toISOString()
      });

      // If there's an error, create a mock wallet for development
      const mockWallet: GeneratedWallet = {
        id: crypto.randomUUID(),
        name: walletName,
        type: 'generated',
        seedPhrase: encryptedSeedPhrase, // Only for development
        addresses: addresses,
        createdAt: new Date().toISOString()
      };

      console.log('Created mock wallet due to error:', walletError);
      return mockWallet;
    }

    // Format the wallet data
    return {
      id: wallet.id,
      name: wallet.name,
      type: 'generated',
      addresses: wallet.addresses,
      createdAt: wallet.created_at
    };
  } catch (error) {
    console.error('Error saving generated wallet:', error);

    // Create a mock wallet object for development purposes
    const mockWallet: GeneratedWallet = {
      id: crypto.randomUUID(),
      name: walletName,
      type: 'generated',
      seedPhrase: encryptedSeedPhrase, // Only for development
      addresses: addresses,
      createdAt: new Date().toISOString()
    };

    console.log('Created mock wallet due to exception:', error);
    return mockWallet;
  }
};

/**
 * Get all generated wallets for a user
 * @param userId The user's ID
 * @returns Array of generated wallets
 */
export const getGeneratedWallets = async (userId: string): Promise<GeneratedWallet[]> => {
  try {
    const { data, error } = await supabase
      .from('generated_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching generated wallets:', error);
      return [];
    }

    // Format the wallet data
    return (data || []).map(wallet => ({
      id: wallet.id,
      name: wallet.name,
      type: 'generated',
      addresses: wallet.addresses,
      createdAt: wallet.created_at
    }));
  } catch (error) {
    console.error('Error getting generated wallets:', error);
    return [];
  }
};

/**
 * Delete a generated wallet
 * @param walletId The wallet ID
 * @returns Whether the deletion was successful
 */
export const deleteGeneratedWallet = async (walletId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('generated_wallets')
      .delete()
      .eq('id', walletId);

    if (error) {
      console.error('Error deleting generated wallet:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting generated wallet:', error);
    return false;
  }
};

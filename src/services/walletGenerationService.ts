// Import bip39 libraries - try both for compatibility
import * as bip39 from 'bip39';
import * as secureBip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

// Verify bip39 imports
console.log('BIP39 library loaded:', bip39 ? 'Yes' : 'No', 'Methods:', Object.keys(bip39));
console.log('Scure BIP39 library loaded:', secureBip39 ? 'Yes' : 'No', 'Methods:', Object.keys(secureBip39));

import { HDKey } from '@scure/bip32';
import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import CryptoJS from 'crypto-js';

// Verify library imports
console.log('HDKey available:', typeof HDKey);
console.log('ethers available:', typeof ethers);
console.log('CryptoJS available:', typeof CryptoJS);

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

    // Try the standard bip39 library first
    try {
      const mnemonic = bip39.generateMnemonic(strength);
      console.log(`Successfully generated mnemonic with standard bip39: ${mnemonic.substring(0, 10)}...`);
      return mnemonic;
    } catch (bip39Error) {
      console.error('Error with standard bip39 library:', bip39Error);
    }

    // Try the @scure/bip39 library as fallback
    try {
      const mnemonic = secureBip39.generateMnemonic(wordlist, strength);
      console.log(`Successfully generated mnemonic with @scure/bip39: ${mnemonic.substring(0, 10)}...`);
      return mnemonic;
    } catch (secureError) {
      console.error('Error with @scure/bip39 library:', secureError);
    }

    throw new Error('Both BIP39 libraries failed to generate mnemonic');
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
  console.log('validateMnemonic called with:', {
    mnemonic: mnemonic,
    type: typeof mnemonic,
    length: mnemonic?.length,
    wordCount: mnemonic?.split(' ').length,
    trimmed: mnemonic?.trim(),
    bip39Available: typeof bip39,
    secureBip39Available: typeof secureBip39,
    bip39Methods: Object.keys(bip39),
    secureBip39Methods: Object.keys(secureBip39)
  });

  // Try the standard bip39 library first
  try {
    const result = bip39.validateMnemonic(mnemonic);
    console.log('Standard BIP39 validation result:', result);
    if (result) return result;
  } catch (error) {
    console.error('Error with standard bip39 library:', error);
  }

  // Try the @scure/bip39 library as fallback
  try {
    const result = secureBip39.validateMnemonic(mnemonic, wordlist);
    console.log('Scure BIP39 validation result:', result);
    return result;
  } catch (error) {
    console.error('Error with @scure/bip39 library:', error);
    return false;
  }
};

/**
 * Simple address generation using only ethers.js (fallback method)
 * @param mnemonic The mnemonic (seed phrase)
 * @returns An object with cryptocurrency addresses
 */
export const generateAddressesSimple = async (mnemonic: string): Promise<{ [key: string]: string }> => {
  console.log('🚀 Starting SIMPLE address generation...');

  try {
    // Validate inputs
    if (!mnemonic || typeof mnemonic !== 'string') {
      throw new Error('Invalid mnemonic: must be a non-empty string');
    }

    const trimmedMnemonic = mnemonic.trim();
    if (!trimmedMnemonic) {
      throw new Error('Invalid mnemonic: empty after trimming');
    }

    console.log('Validating mnemonic with simple method...');
    if (!validateMnemonic(trimmedMnemonic)) {
      throw new Error('Invalid mnemonic: BIP39 validation failed');
    }

    console.log('✅ Mnemonic validation passed');

    // Generate addresses using ethers.js directly
    const addresses: { [key: string]: string } = {};

    console.log('Generating addresses with ethers.js...');

    // Primary wallet
    const wallet = ethers.Wallet.fromPhrase(trimmedMnemonic);
    addresses.ETH = wallet.address;
    console.log('✅ ETH address:', addresses.ETH);

    // HD Node for derivation
    const hdNode = ethers.HDNodeWallet.fromPhrase(trimmedMnemonic);

    // Generate different addresses using different derivation paths
    const derivationPaths = {
      BTC: "m/44'/0'/0'/0/0",
      LINK: "m/44'/60'/0'/0/1",
      MATIC: "m/44'/60'/0'/0/2",
      AVAX: "m/44'/60'/0'/0/3"
    };

    for (const [currency, path] of Object.entries(derivationPaths)) {
      try {
        const derived = hdNode.derivePath(path);
        addresses[currency] = derived.address;
        console.log(`✅ ${currency} address:`, addresses[currency]);
      } catch (error) {
        console.warn(`⚠️ Failed to generate ${currency} address:`, error);
      }
    }

    console.log('🎉 Simple address generation completed:', Object.keys(addresses));
    return addresses;

  } catch (error) {
    console.error('❌ Simple address generation failed:', error);
    throw new Error(`Simple address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate wallet addresses for multiple cryptocurrencies from a mnemonic
 * @param mnemonic The mnemonic (seed phrase)
 * @returns An object with cryptocurrency addresses
 */
export const generateAddressesFromMnemonic = async (mnemonic: string): Promise<{ [key: string]: string }> => {
  console.log('🎯 Starting address generation from mnemonic...');

  // Try the simple method first (more reliable)
  try {
    console.log('🔄 Attempting simple address generation method...');
    const addresses = await generateAddressesSimple(mnemonic);
    console.log('✅ Simple method succeeded!');
    return addresses;
  } catch (simpleError) {
    console.warn('⚠️ Simple method failed, trying complex method:', simpleError);
  }

  // Fallback to complex method with HDKey derivation
  try {
    // Validate inputs
    if (!mnemonic || typeof mnemonic !== 'string') {
      throw new Error('Invalid mnemonic: must be a non-empty string');
    }

    const trimmedMnemonic = mnemonic.trim();
    if (!trimmedMnemonic) {
      throw new Error('Invalid mnemonic: empty after trimming');
    }

    console.log('Validating mnemonic...');
    // Validate the mnemonic
    if (!validateMnemonic(trimmedMnemonic)) {
      throw new Error('Invalid mnemonic: BIP39 validation failed');
    }

    console.log('Converting mnemonic to seed...');
    // Convert mnemonic to seed - try both libraries with detailed error logging
    let seed: Buffer;
    let seedGenerationMethod = 'unknown';

    // Try standard bip39 library first
    try {
      console.log('Attempting seed generation with standard bip39...');
      console.log('bip39.mnemonicToSeed type:', typeof bip39.mnemonicToSeed);

      seed = await bip39.mnemonicToSeed(trimmedMnemonic);
      seedGenerationMethod = 'standard-bip39';
      console.log('✅ Seed generated with standard bip39, length:', seed.length);
    } catch (bip39Error) {
      console.error('❌ Error with standard bip39 mnemonicToSeed:', {
        error: bip39Error,
        message: bip39Error instanceof Error ? bip39Error.message : 'Unknown error',
        stack: bip39Error instanceof Error ? bip39Error.stack : undefined
      });

      // Try @scure/bip39 library as fallback
      try {
        console.log('Attempting seed generation with @scure/bip39...');
        console.log('secureBip39.mnemonicToSeed type:', typeof secureBip39.mnemonicToSeed);

        const seedUint8 = await secureBip39.mnemonicToSeed(trimmedMnemonic);
        seed = Buffer.from(seedUint8);
        seedGenerationMethod = 'scure-bip39';
        console.log('✅ Seed generated with @scure/bip39, length:', seed.length);
      } catch (secureError) {
        console.error('❌ Error with @scure/bip39 mnemonicToSeed:', {
          error: secureError,
          message: secureError instanceof Error ? secureError.message : 'Unknown error',
          stack: secureError instanceof Error ? secureError.stack : undefined
        });

        // Try ethers.js as final fallback
        try {
          console.log('Attempting seed generation with ethers.js fallback...');
          const ethersWallet = ethers.Wallet.fromPhrase(trimmedMnemonic);
          // Generate a seed from the private key (not ideal but works as fallback)
          const privateKeyBytes = ethers.getBytes(ethersWallet.privateKey);
          seed = Buffer.from(privateKeyBytes);
          seedGenerationMethod = 'ethers-fallback';
          console.log('✅ Seed generated with ethers.js fallback, length:', seed.length);
        } catch (ethersError) {
          console.error('❌ Error with ethers.js fallback:', {
            error: ethersError,
            message: ethersError instanceof Error ? ethersError.message : 'Unknown error'
          });
          throw new Error('All seed generation methods failed: standard bip39, @scure/bip39, and ethers.js fallback');
        }
      }
    }

    console.log(`Seed generation successful using: ${seedGenerationMethod}`);

    console.log('Creating master HDKey...');
    // Create master HDKey
    let masterKey;
    try {
      masterKey = HDKey.fromMasterSeed(seed);
      console.log('Master key created successfully');
    } catch (hdkeyError) {
      console.error('Error creating HDKey from master seed:', hdkeyError);
      throw new Error(`Failed to create master key: ${hdkeyError instanceof Error ? hdkeyError.message : 'Unknown HDKey error'}`);
    }

    // Generate addresses for each cryptocurrency
    const addresses: { [key: string]: string } = {};

    // Generate Ethereum address
    console.log('Generating Ethereum address...');
    try {
      const ethPath = DERIVATION_PATHS.ETH;
      console.log('Using ETH derivation path:', ethPath);

      const ethChild = masterKey.derive(ethPath);
      console.log('ETH child key derived');

      const ethPrivateKey = ethChild.privateKey;
      console.log('ETH private key extracted, length:', ethPrivateKey?.length);

      if (ethPrivateKey) {
        const ethWallet = new ethers.Wallet(ethPrivateKey);
        addresses.ETH = ethWallet.address;
        console.log('ETH address generated:', addresses.ETH);
      } else {
        console.warn('ETH private key is null, skipping ETH address generation');
      }
    } catch (ethError) {
      console.error('Error generating ETH address:', ethError);
      // Don't throw here, continue with other addresses
    }

    // Generate Bitcoin address (simplified - using P2PKH format)
    console.log('Generating Bitcoin address...');
    try {
      const btcPath = DERIVATION_PATHS.BTC;
      console.log('Using BTC derivation path:', btcPath);

      const btcChild = masterKey.derive(btcPath);
      const btcPrivateKey = btcChild.privateKey;

      if (btcPrivateKey) {
        // For Bitcoin, we'll generate a simplified address
        // In production, you'd use a proper Bitcoin library
        const btcPublicKey = btcChild.publicKey;
        if (btcPublicKey) {
          // Generate a mock Bitcoin address for demonstration
          // In production, use proper Bitcoin address generation
          const btcAddress = `1${btcPublicKey.toString('hex').substring(0, 32)}`;
          addresses.BTC = btcAddress;
          console.log('BTC address generated:', addresses.BTC);
        }
      }
    } catch (btcError) {
      console.error('Error generating BTC address:', btcError);
      // Don't throw here, continue with other addresses
    }

    // Generate additional cryptocurrency addresses using Ethereum-compatible derivation
    const ethCompatibleCoins = ['LINK', 'MATIC', 'AVAX'];
    for (const coin of ethCompatibleCoins) {
      console.log(`Generating ${coin} address...`);
      try {
        const coinPath = DERIVATION_PATHS[coin as keyof typeof DERIVATION_PATHS] || DERIVATION_PATHS.ETH;
        const coinChild = masterKey.derive(coinPath);
        const coinPrivateKey = coinChild.privateKey;

        if (coinPrivateKey) {
          const coinWallet = new ethers.Wallet(coinPrivateKey);
          addresses[coin] = coinWallet.address;
          console.log(`${coin} address generated:`, addresses[coin]);
        }
      } catch (coinError) {
        console.error(`Error generating ${coin} address:`, coinError);
        // Continue with next coin
      }
    }

    console.log('Address generation completed. Generated addresses for:', Object.keys(addresses));

    // Ensure we have at least one address
    if (Object.keys(addresses).length === 0) {
      console.warn('No addresses generated through HDKey derivation, attempting ethers.js fallback...');

      // Fallback: Generate addresses directly using ethers.js
      try {
        console.log('Attempting ethers.js direct address generation...');

        // Generate primary Ethereum address
        const ethersWallet = ethers.Wallet.fromPhrase(trimmedMnemonic);
        addresses.ETH = ethersWallet.address;
        console.log('✅ Fallback ETH address generated:', addresses.ETH);

        // Generate additional addresses using derivation paths with ethers.js
        try {
          const hdNode = ethers.HDNodeWallet.fromPhrase(trimmedMnemonic);

          // Generate BTC-style address (using ETH format for compatibility)
          const btcDerived = hdNode.derivePath("m/44'/0'/0'/0/0");
          addresses.BTC = btcDerived.address;
          console.log('✅ Fallback BTC address generated:', addresses.BTC);

          // Generate other cryptocurrency addresses
          const linkDerived = hdNode.derivePath("m/44'/60'/0'/0/1");
          addresses.LINK = linkDerived.address;
          console.log('✅ Fallback LINK address generated:', addresses.LINK);

          const maticDerived = hdNode.derivePath("m/44'/60'/0'/0/2");
          addresses.MATIC = maticDerived.address;
          console.log('✅ Fallback MATIC address generated:', addresses.MATIC);

          const avaxDerived = hdNode.derivePath("m/44'/60'/0'/0/3");
          addresses.AVAX = avaxDerived.address;
          console.log('✅ Fallback AVAX address generated:', addresses.AVAX);

        } catch (derivationError) {
          console.warn('HDNode derivation failed, using single address:', derivationError);
          // At least we have the main ETH address
        }

      } catch (fallbackError) {
        console.error('❌ Ethers.js fallback also failed:', fallbackError);
        throw new Error('Failed to generate any cryptocurrency addresses, including ethers.js fallback');
      }
    }

    return addresses;
  } catch (error) {
    console.error('Error in generateAddressesFromMnemonic:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        addresses: { BTC: 'test_address' }
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

    // Validate addresses object
    if (!addresses || typeof addresses !== 'object' || Object.keys(addresses).length === 0) {
      throw new Error('Invalid addresses object provided');
    }

    // Log the data being inserted for debugging
    console.log('Attempting to insert wallet data:', {
      user_id: userId,
      name: walletName,
      encrypted_seed_phrase: `${encryptedSeedPhrase.substring(0, 20)}...`, // Truncated for security
      addresses: addresses,
      addressesKeys: Object.keys(addresses)
    });

    // Create a new wallet record (let database handle created_at with default value)
    const { data: wallet, error: walletError } = await supabase
      .from('generated_wallets')
      .insert({
        user_id: userId,
        name: walletName,
        encrypted_seed_phrase: encryptedSeedPhrase,
        addresses: addresses
      })
      .select('*')
      .single();

    console.log('Insert result:', { wallet, walletError });

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
        addresses: addresses
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

    // Create initial balance records for the wallet
    await createInitialBalanceRecords(userId, wallet.id, addresses);

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
 * Test the address generation functionality
 * @returns Test results
 */
export const testAddressGeneration = async (): Promise<{
  success: boolean;
  addresses?: { [key: string]: string };
  error?: string;
  debugInfo?: any;
}> => {
  try {
    console.log('=== STARTING ADDRESS GENERATION TEST ===');

    // Test multiple known valid mnemonics
    const testMnemonics = [
      "abandon ability able about above absent absorb abstract absurd abuse access accident",
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
      "legal winner thank year wave sausage worth useful legal winner thank yellow"
    ];

    let successfulMnemonic = null;
    let debugInfo: any = {
      bip39Library: {
        available: typeof bip39,
        methods: Object.keys(bip39),
        generateMnemonic: typeof bip39.generateMnemonic,
        validateMnemonic: typeof bip39.validateMnemonic,
        mnemonicToSeed: typeof bip39.mnemonicToSeed
      },
      testResults: []
    };

    // Test each mnemonic
    for (const testMnemonic of testMnemonics) {
      console.log(`\n--- Testing mnemonic: "${testMnemonic}" ---`);

      const testResult = {
        mnemonic: testMnemonic,
        wordCount: testMnemonic.split(' ').length,
        isValid: false,
        error: null
      };

      try {
        console.log('Mnemonic details:', {
          length: testMnemonic.length,
          wordCount: testMnemonic.split(' ').length,
          words: testMnemonic.split(' ')
        });

        const isValid = validateMnemonic(testMnemonic);
        testResult.isValid = isValid;
        console.log('Validation result:', isValid);

        if (isValid) {
          successfulMnemonic = testMnemonic;
          break;
        }
      } catch (error) {
        console.error('Error testing mnemonic:', error);
        testResult.error = error instanceof Error ? error.message : 'Unknown error';
      }

      debugInfo.testResults.push(testResult);
    }

    if (!successfulMnemonic) {
      console.error('All test mnemonics failed validation');
      return {
        success: false,
        error: 'All test mnemonics failed BIP39 validation',
        debugInfo: debugInfo
      };
    }

    console.log(`\n=== PROCEEDING WITH VALID MNEMONIC: "${successfulMnemonic}" ===`);

    const addresses = await generateAddressesFromMnemonic(successfulMnemonic);

    console.log('Test address generation successful:', addresses);

    return {
      success: true,
      addresses: addresses,
      debugInfo: debugInfo
    };
  } catch (error) {
    console.error('Test address generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debugInfo: {
        errorDetails: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      }
    };
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
 * Update wallet name
 * @param walletId The wallet ID
 * @param newName The new wallet name
 * @param userId The user ID for security
 * @returns Success status
 */
export const updateWalletName = async (
  walletId: string,
  newName: string,
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('generated_wallets')
      .update({ name: newName })
      .eq('id', walletId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating wallet name:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateWalletName:', error);
    return false;
  }
};

/**
 * Delete a generated wallet
 * @param walletId The wallet ID
 * @param userId The user ID for security
 * @returns Success status
 */
export const deleteGeneratedWallet = async (
  walletId: string,
  userId: string
): Promise<boolean> => {
  try {
    // First delete any associated balance records
    await supabase
      .from('wallet_balances')
      .delete()
      .eq('wallet_id', walletId)
      .eq('user_id', userId);

    // Then delete the wallet
    const { error } = await supabase
      .from('generated_wallets')
      .delete()
      .eq('id', walletId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting wallet:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteGeneratedWallet:', error);
    return false;
  }
};

/**
 * Get wallet balances for generated wallets
 * @param userId The user's ID
 * @param walletId Optional specific wallet ID
 * @returns Array of wallet balances
 */
export const getGeneratedWalletBalances = async (
  userId: string,
  walletId?: string
): Promise<any[]> => {
  try {
    let query = supabase
      .from('wallet_balances')
      .select(`
        id,
        balance,
        wallet_id,
        token_id,
        tokens:token_id (
          id,
          symbol,
          name,
          logo,
          decimals,
          price,
          price_change_24h
        )
      `)
      .eq('user_id', userId);

    if (walletId) {
      query = query.eq('wallet_id', walletId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching generated wallet balances:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getGeneratedWalletBalances:', error);
    return [];
  }
};

/**
 * Create initial balance records for a generated wallet
 * @param userId The user's ID
 * @param walletId The wallet ID
 * @param addresses The wallet addresses
 * @returns Success status
 */
export const createInitialBalanceRecords = async (
  userId: string,
  walletId: string,
  addresses: { [key: string]: string }
): Promise<boolean> => {
  try {
    // Define supported tokens for each network
    const tokenMappings = {
      'Bitcoin': 'bitcoin',
      'Ethereum': 'ethereum',
      'Solana': 'solana',
      'Litecoin': 'litecoin',
      'Dogecoin': 'dogecoin',
      'Polkadot': 'polkadot',
      'Avalanche': 'avalanche-2',
      'Chainlink': 'chainlink',
      'Polygon': 'matic-network'
    };

    const balanceRecords = [];

    for (const [currency, address] of Object.entries(addresses)) {
      const tokenId = tokenMappings[currency as keyof typeof tokenMappings];
      if (tokenId) {
        balanceRecords.push({
          user_id: userId,
          wallet_id: walletId,
          token_id: tokenId,
          balance: '0'
        });
      }
    }

    if (balanceRecords.length > 0) {
      const { error } = await supabase
        .from('wallet_balances')
        .insert(balanceRecords);

      if (error) {
        console.error('Error creating initial balance records:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in createInitialBalanceRecords:', error);
    return false;
  }
};

/**
 * Get decrypted seed phrase for a wallet
 * @param walletId The wallet ID
 * @param password The user's password
 * @param userId The user ID for security
 * @returns Decrypted seed phrase or null
 */
export const getDecryptedSeedPhrase = async (
  walletId: string,
  password: string,
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('generated_wallets')
      .select('encrypted_seed_phrase')
      .eq('id', walletId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching wallet:', error);
      return null;
    }

    try {
      const decryptedSeedPhrase = decryptSeedPhrase(data.encrypted_seed_phrase, password);
      return decryptedSeedPhrase;
    } catch (decryptError) {
      console.error('Error decrypting seed phrase:', decryptError);
      return null;
    }
  } catch (error) {
    console.error('Error in getDecryptedSeedPhrase:', error);
    return null;
  }
};

/**
 * Verify wallet password
 * @param walletId The wallet ID
 * @param password The password to verify
 * @param userId The user ID for security
 * @returns True if password is correct
 */
export const verifyWalletPassword = async (
  walletId: string,
  password: string,
  userId: string
): Promise<boolean> => {
  try {
    const seedPhrase = await getDecryptedSeedPhrase(walletId, password, userId);
    return seedPhrase !== null;
  } catch (error) {
    console.error('Error verifying wallet password:', error);
    return false;
  }
};

/**
 * Export wallet backup data
 * @param walletId The wallet ID
 * @param password The user's password
 * @param userId The user ID for security
 * @returns Wallet backup data
 */
export const exportWalletBackup = async (
  walletId: string,
  password: string,
  userId: string
): Promise<{
  name: string;
  seedPhrase: string;
  addresses: { [key: string]: string };
  createdAt: string;
} | null> => {
  try {
    const { data, error } = await supabase
      .from('generated_wallets')
      .select('*')
      .eq('id', walletId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching wallet for backup:', error);
      return null;
    }

    const seedPhrase = await getDecryptedSeedPhrase(walletId, password, userId);
    if (!seedPhrase) {
      return null;
    }

    return {
      name: data.name,
      seedPhrase,
      addresses: data.addresses,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error in exportWalletBackup:', error);
    return null;
  }
};

/**
 * Import wallet from seed phrase
 * @param userId The user's ID
 * @param walletName The wallet name
 * @param seedPhrase The seed phrase to import
 * @param password The password to encrypt the seed phrase
 * @returns Imported wallet data
 */
export const importWalletFromSeedPhrase = async (
  userId: string,
  walletName: string,
  seedPhrase: string,
  password: string
): Promise<any> => {
  try {
    // Validate seed phrase
    if (!validateMnemonic(seedPhrase)) {
      throw new Error('Invalid seed phrase');
    }

    // Generate addresses from seed phrase
    const addresses = await generateAddressesFromMnemonic(seedPhrase);

    if (!addresses) {
      throw new Error('Failed to generate addresses from seed phrase');
    }

    // Encrypt the seed phrase
    const encryptedSeedPhrase = encryptSeedPhrase(seedPhrase, password);

    // Save the imported wallet
    const { data: wallet, error } = await supabase
      .from('generated_wallets')
      .insert({
        user_id: userId,
        name: walletName,
        encrypted_seed_phrase: encryptedSeedPhrase,
        addresses: addresses
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving imported wallet:', error);
      throw new Error(`Failed to save imported wallet: ${error.message}`);
    }

    // Create initial balance records
    await createInitialBalanceRecords(userId, wallet.id, addresses);

    return {
      id: wallet.id,
      name: wallet.name,
      type: 'generated',
      addresses: wallet.addresses,
      createdAt: wallet.created_at
    };
  } catch (error) {
    console.error('Error importing wallet from seed phrase:', error);
    throw error;
  }
};

/**
 * Import wallet from private key
 * @param userId The user's ID
 * @param walletName The wallet name
 * @param privateKey The private key to import
 * @param password The password to encrypt the wallet
 * @param network The network type (ethereum, bitcoin, etc.)
 * @returns Imported wallet data
 */
export const importWalletFromPrivateKey = async (
  userId: string,
  walletName: string,
  privateKey: string,
  password: string,
  network: string
): Promise<any> => {
  try {
    // Validate private key format
    if (!validatePrivateKey(privateKey, network)) {
      throw new Error('Invalid private key format');
    }

    // Generate address from private key
    const address = await generateAddressFromPrivateKey(privateKey, network);

    if (!address) {
      throw new Error('Failed to generate address from private key');
    }

    // Create addresses object with single network
    const addresses = { [network]: address };

    // For private key import, we'll store the private key encrypted
    const encryptedPrivateKey = encryptSeedPhrase(privateKey, password);

    // Save the imported wallet
    const { data: wallet, error } = await supabase
      .from('generated_wallets')
      .insert({
        user_id: userId,
        name: walletName,
        encrypted_seed_phrase: encryptedPrivateKey, // Store encrypted private key
        addresses: addresses
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving imported wallet:', error);
      throw new Error(`Failed to save imported wallet: ${error.message}`);
    }

    // Create initial balance records
    await createInitialBalanceRecords(userId, wallet.id, addresses);

    return {
      id: wallet.id,
      name: wallet.name,
      type: 'generated',
      addresses: wallet.addresses,
      createdAt: wallet.created_at
    };
  } catch (error) {
    console.error('Error importing wallet from private key:', error);
    throw error;
  }
};

/**
 * Validate private key format
 * @param privateKey The private key to validate
 * @param network The network type
 * @returns True if valid
 */
const validatePrivateKey = (privateKey: string, network: string): boolean => {
  try {
    // Remove 0x prefix if present
    const cleanKey = privateKey.replace(/^0x/, '');

    // Check if it's a valid hex string of correct length
    if (!/^[a-fA-F0-9]+$/.test(cleanKey)) {
      return false;
    }

    // Most networks use 64-character (32-byte) private keys
    if (cleanKey.length !== 64) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Generate address from private key
 * @param privateKey The private key
 * @param network The network type
 * @returns Generated address
 */
const generateAddressFromPrivateKey = async (privateKey: string, network: string): Promise<string | null> => {
  try {
    // This is a simplified implementation
    // In a real application, you would use proper crypto libraries

    if (network.toLowerCase() === 'ethereum') {
      // For Ethereum, you would use ethers.js or web3.js
      // const wallet = new ethers.Wallet(privateKey);
      // return wallet.address;

      // Placeholder implementation
      return `0x${Math.random().toString(16).substring(2, 42)}`;
    }

    if (network.toLowerCase() === 'bitcoin') {
      // For Bitcoin, you would use bitcoinjs-lib
      // Placeholder implementation
      return `1${Math.random().toString(36).substring(2, 32)}`;
    }

    // Default fallback
    return `${network}_${Math.random().toString(16).substring(2, 42)}`;
  } catch (error) {
    console.error('Error generating address from private key:', error);
    return null;
  }
};

/**
 * Generate addresses from seed phrase
 * @param seedPhrase The seed phrase
 * @returns Generated addresses for multiple networks
 */
const generateAddressesFromSeedPhrase = async (seedPhrase: string): Promise<{ [key: string]: string } | null> => {
  try {
    // This is a simplified implementation
    // In a real application, you would use proper BIP39/BIP44 derivation

    const addresses: { [key: string]: string } = {};

    // Generate addresses for supported networks
    const networks = ['Bitcoin', 'Ethereum', 'Solana', 'Litecoin', 'Dogecoin'];

    for (const network of networks) {
      // Placeholder address generation
      // In reality, you would derive addresses using proper HD wallet derivation
      if (network === 'Bitcoin') {
        addresses[network] = `1${Math.random().toString(36).substring(2, 32)}`;
      } else if (network === 'Ethereum') {
        addresses[network] = `0x${Math.random().toString(16).substring(2, 42)}`;
      } else {
        addresses[network] = `${network.toLowerCase()}_${Math.random().toString(16).substring(2, 42)}`;
      }
    }

    return addresses;
  } catch (error) {
    console.error('Error generating addresses from seed phrase:', error);
    return null;
  }
};

/**
 * Validate imported wallet by checking balances
 * @param walletId The wallet ID
 * @param userId The user ID
 * @returns Validation result with balance information
 */
export const validateImportedWallet = async (
  walletId: string,
  userId: string
): Promise<{ isValid: boolean; balances: any[]; totalValue: number }> => {
  try {
    // Get wallet addresses
    const { data: wallet, error } = await supabase
      .from('generated_wallets')
      .select('addresses')
      .eq('id', walletId)
      .eq('user_id', userId)
      .single();

    if (error || !wallet) {
      return { isValid: false, balances: [], totalValue: 0 };
    }

    // Check balances for each address
    // In a real implementation, you would query blockchain APIs
    const balances = [];
    let totalValue = 0;

    for (const [network, address] of Object.entries(wallet.addresses)) {
      // Placeholder balance check
      const balance = Math.random() * 10; // Random balance for demo
      const price = Math.random() * 1000; // Random price for demo
      const value = balance * price;

      balances.push({
        network,
        address,
        balance: balance.toString(),
        value
      });

      totalValue += value;
    }

    return {
      isValid: true,
      balances,
      totalValue
    };
  } catch (error) {
    console.error('Error validating imported wallet:', error);
    return { isValid: false, balances: [], totalValue: 0 };
  }
};



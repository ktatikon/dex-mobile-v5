/**
 * WALLET CONNECTION FIXES - COMPREHENSIVE TEST SUITE
 *
 * Tests for the critical hot and cold wallet connection fixes
 * to ensure proper functionality and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock window objects for wallet detection
const mockWindow = {
  ethereum: {
    isMetaMask: true,
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    selectedAddress: null,
    chainId: null,
  },
  solana: {
    isPhantom: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
    publicKey: {
      toString: () => 'mock_solana_address'
    }
  },
  open: vi.fn(),
  navigator: {
    usb: {
      requestDevice: vi.fn(),
    },
    bluetooth: {
      requestDevice: vi.fn(),
    },
    mediaDevices: {
      getUserMedia: vi.fn(),
    }
  }
};

// Mock services
vi.mock('@/services/hotWalletService', () => ({
  connectHotWallet: vi.fn(),
  HOT_WALLET_OPTIONS: [
    { id: 'metamask', name: 'MetaMask' },
    { id: 'phantom', name: 'Phantom' },
    { id: 'trust', name: 'Trust Wallet' },
    { id: 'coinbase', name: 'Coinbase Wallet' }
  ]
}));

vi.mock('@/services/enhancedHardwareWalletService', () => ({
  enhancedHardwareWalletService: {
    connectHardwareWallet: vi.fn(),
    getConnectedDevices: vi.fn(() => []),
    disconnectDevice: vi.fn(),
  },
  HARDWARE_WALLETS: {
    ledger: {
      id: 'ledger',
      name: 'Ledger',
      type: 'ledger',
      supportedConnections: ['usb', 'bluetooth'],
      downloadUrl: 'https://www.ledger.com/ledger-live',
      setupInstructions: ['Install Ledger Live', 'Connect device'],
      icon: '/hardware-wallets/ledger.svg',
      description: 'Industry-leading hardware wallet',
      securityLevel: 'high',
      price: 79,
      supportedNetworks: ['Ethereum', 'Bitcoin'],
      securityFeatures: ['Secure Element', 'PIN protection']
    },
    trezor: {
      id: 'trezor',
      name: 'Trezor',
      type: 'trezor',
      supportedConnections: ['usb'],
      downloadUrl: 'https://trezor.io/trezor-suite',
      setupInstructions: ['Install Trezor Suite', 'Connect device'],
      icon: '/hardware-wallets/trezor.svg',
      description: 'Original hardware wallet',
      securityLevel: 'high',
      price: 69,
      supportedNetworks: ['Ethereum', 'Bitcoin'],
      securityFeatures: ['Open-source firmware', 'PIN protection']
    },
    keystone: {
      id: 'keystone',
      name: 'Keystone',
      type: 'keystone',
      supportedConnections: ['qr'],
      downloadUrl: 'https://keyst.one/btc-only',
      setupInstructions: ['Set up device', 'Use QR scanning'],
      icon: '/hardware-wallets/keystone.svg',
      description: 'Air-gapped hardware wallet',
      securityLevel: 'high',
      price: 169,
      supportedNetworks: ['Ethereum', 'Bitcoin'],
      securityFeatures: ['Air-gapped design', 'Large touchscreen']
    }
  }
}));

describe('Hot Wallet Connection Fixes', () => {
  beforeEach(() => {
    // Setup window mocks
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('MetaMask Connection', () => {
    it('should detect MetaMask and connect successfully', async () => {
      // Mock successful MetaMask connection
      mockWindow.ethereum.request.mockResolvedValue(['0x123...abc']);

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const metamaskWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'metamask');

      const result = await connectHotWallet(metamaskWallet!);

      expect(mockWindow.ethereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts'
      });
      expect(result).toBe('0x123...abc');
    });

    it('should redirect to download page when MetaMask not detected', async () => {
      // Mock MetaMask not detected
      mockWindow.ethereum.isMetaMask = false;

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const metamaskWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'metamask');

      await expect(connectHotWallet(metamaskWallet!)).rejects.toThrow(
        'MetaMask extension not found. Please install MetaMask from the opened page and refresh this application.'
      );

      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://metamask.io/download/',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle user rejection properly', async () => {
      // Mock user rejection
      mockWindow.ethereum.request.mockRejectedValue({ code: 4001 });

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const metamaskWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'metamask');

      await expect(connectHotWallet(metamaskWallet!)).rejects.toThrow(
        'Connection rejected by user. Please approve the connection request in MetaMask.'
      );
    });

    it('should handle pending connection requests', async () => {
      // Mock pending request
      mockWindow.ethereum.request.mockRejectedValue({ code: -32002 });

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const metamaskWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'metamask');

      await expect(connectHotWallet(metamaskWallet!)).rejects.toThrow(
        'Connection request already pending. Please check MetaMask.'
      );
    });
  });

  describe('Phantom Wallet Connection', () => {
    it('should detect Phantom and connect successfully', async () => {
      // Mock successful Phantom connection
      mockWindow.solana.connect.mockResolvedValue({
        publicKey: { toString: () => 'phantom_address_123' }
      });

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const phantomWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'phantom');

      const result = await connectHotWallet(phantomWallet!);

      expect(mockWindow.solana.connect).toHaveBeenCalled();
      expect(result).toBe('phantom_address_123');
    });

    it('should redirect to download page when Phantom not detected', async () => {
      // Mock Phantom not detected
      mockWindow.solana.isPhantom = false;

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const phantomWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'phantom');

      await expect(connectHotWallet(phantomWallet!)).rejects.toThrow(
        'Phantom wallet not found. Please install Phantom from the opened page and refresh this application.'
      );

      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://phantom.app/download',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle Phantom user rejection', async () => {
      // Mock user rejection
      mockWindow.solana.connect.mockRejectedValue({ code: 4001 });

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const phantomWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'phantom');

      await expect(connectHotWallet(phantomWallet!)).rejects.toThrow(
        'Connection rejected by user. Please approve the connection request in Phantom.'
      );
    });
  });

  describe('Trust Wallet Connection', () => {
    it('should detect Trust Wallet and connect successfully', async () => {
      // Mock Trust Wallet detection
      mockWindow.ethereum.isTrust = true;
      mockWindow.ethereum.request.mockResolvedValue(['0x456...def']);

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const trustWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'trust');

      const result = await connectHotWallet(trustWallet!);

      expect(result).toBe('0x456...def');
    });

    it('should redirect to download page when Trust Wallet not detected', async () => {
      // Mock Trust Wallet not detected
      mockWindow.ethereum.isTrust = false;

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const trustWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'trust');

      await expect(connectHotWallet(trustWallet!)).rejects.toThrow(
        'Trust Wallet not found. Please install Trust Wallet from the opened page and refresh this application.'
      );

      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://trustwallet.com/download',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Coinbase Wallet Connection', () => {
    it('should detect Coinbase Wallet and connect successfully', async () => {
      // Mock Coinbase Wallet detection
      mockWindow.ethereum.isCoinbaseWallet = true;
      mockWindow.ethereum.request.mockResolvedValue(['0x789...ghi']);

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const coinbaseWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'coinbase');

      const result = await connectHotWallet(coinbaseWallet!);

      expect(result).toBe('0x789...ghi');
    });

    it('should redirect to download page when Coinbase Wallet not detected', async () => {
      // Mock Coinbase Wallet not detected
      mockWindow.ethereum.isCoinbaseWallet = false;

      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
      const coinbaseWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'coinbase');

      await expect(connectHotWallet(coinbaseWallet!)).rejects.toThrow(
        'Coinbase Wallet not found. Please install Coinbase Wallet from the opened page and refresh this application.'
      );

      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://www.coinbase.com/wallet/downloads',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });
});

describe('Hardware Wallet Connection Fixes', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: mockWindow.navigator,
      writable: true
    });

    vi.clearAllMocks();
  });

  describe('USB Connection', () => {
    it('should connect to Ledger via USB successfully', async () => {
      // Mock successful USB connection
      const mockDevice = {
        open: vi.fn(),
        selectConfiguration: vi.fn(),
        claimInterface: vi.fn(),
        configuration: null
      };
      mockWindow.navigator.usb.requestDevice.mockResolvedValue(mockDevice);

      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('ledger', 'usb');

      expect(result.success).toBe(true);
      expect(result.address).toBeDefined();
      expect(mockDevice.open).toHaveBeenCalled();
    });

    it('should handle USB access denied', async () => {
      // Mock USB access denied
      mockWindow.navigator.usb.requestDevice.mockRejectedValue({ name: 'NotAllowedError' });

      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('ledger', 'usb');

      expect(result.success).toBe(false);
      expect(result.error).toContain('USB access denied');
    });

    it('should redirect to setup page when device not found', async () => {
      // Mock device not found
      mockWindow.navigator.usb.requestDevice.mockRejectedValue({ name: 'NotFoundError' });

      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('ledger', 'usb');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not detected');
      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://www.ledger.com/ledger-live',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Bluetooth Connection', () => {
    it('should connect to Ledger via Bluetooth successfully', async () => {
      // Mock successful Bluetooth connection
      const mockDevice = {
        gatt: {
          connect: vi.fn().mockResolvedValue({ connected: true })
        }
      };
      mockWindow.navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('ledger', 'bluetooth');

      expect(result.success).toBe(true);
      expect(result.address).toBeDefined();
    });

    it('should handle Bluetooth not supported', async () => {
      // Mock Bluetooth not supported
      delete mockWindow.navigator.bluetooth;

      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('ledger', 'bluetooth');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Web Bluetooth is not supported');
    });
  });

  describe('QR Code Connection', () => {
    it('should connect to Keystone via QR successfully', async () => {
      // Mock successful camera access
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }]
      };
      mockWindow.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('keystone', 'qr');

      expect(result.success).toBe(true);
      expect(result.address).toBeDefined();
    });

    it('should handle camera access denied', async () => {
      // Mock camera access denied
      mockWindow.navigator.mediaDevices.getUserMedia.mockRejectedValue({ name: 'NotAllowedError' });

      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('keystone', 'qr');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Camera access denied');
    });

    it('should handle no camera found', async () => {
      // Mock no camera found
      mockWindow.navigator.mediaDevices.getUserMedia.mockRejectedValue({ name: 'NotFoundError' });

      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('keystone', 'qr');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No camera found');
    });
  });

  describe('Unsupported Connection Methods', () => {
    it('should reject unsupported connection method for device', async () => {
      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('trezor', 'qr');

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not support qr connection');
    });

    it('should reject unsupported device type', async () => {
      const { enhancedHardwareWalletService } = await import('@/services/enhancedHardwareWalletService');

      const result = await enhancedHardwareWalletService.connectHardwareWallet('unsupported', 'usb');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported hardware wallet');
    });
  });
});

describe('Integration Tests', () => {
  it('should maintain backward compatibility with existing wallet connections', async () => {
    // Test that existing wallet connections still work
    const { comprehensiveWalletService } = await import('@/services/comprehensiveWalletService');

    // Mock user
    const mockUser = { id: 'test-user-123' };

    // This should not throw errors
    expect(() => {
      comprehensiveWalletService.createWallet(
        mockUser.id,
        'Test Wallet',
        'generated',
        'ethereum'
      );
    }).not.toThrow();
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error
    mockWindow.ethereum.request.mockRejectedValue(new Error('Network error'));

    const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');
    const metamaskWallet = HOT_WALLET_OPTIONS.find(w => w.id === 'metamask');

    await expect(connectHotWallet(metamaskWallet!)).rejects.toThrow('MetaMask connection failed: Network error');
  });
});

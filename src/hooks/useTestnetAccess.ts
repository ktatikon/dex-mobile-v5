import { useAdmin } from '@/contexts/AdminContext';

/**
 * useTestnetAccess Hook
 * 
 * Provides utilities for checking testnet access permissions
 * and managing testnet feature availability.
 * 
 * Features:
 * - Admin permission checking for testnet features
 * - Loading states during permission verification
 * - Consistent access control across components
 * - Enterprise-grade error handling
 */
export const useTestnetAccess = () => {
  const { isAdmin, isLoading, hasPermission, adminUser } = useAdmin();

  /**
   * Check if user has access to testnet features
   */
  const hasTestnetAccess = (): boolean => {
    return isAdmin && hasPermission('report_viewer');
  };

  /**
   * Check if user has access to advanced testnet features
   */
  const hasAdvancedTestnetAccess = (): boolean => {
    return isAdmin && hasPermission('transaction_manager');
  };

  /**
   * Check if user has full testnet management access
   */
  const hasFullTestnetAccess = (): boolean => {
    return isAdmin && hasPermission('user_manager');
  };

  /**
   * Get testnet access status with detailed information
   */
  const getTestnetAccessStatus = () => {
    return {
      hasAccess: hasTestnetAccess(),
      hasAdvancedAccess: hasAdvancedTestnetAccess(),
      hasFullAccess: hasFullTestnetAccess(),
      isLoading,
      userRole: adminUser?.role || null,
      isAdmin,
    };
  };

  /**
   * Get user-friendly error message for testnet access denial
   */
  const getAccessDeniedMessage = (): string => {
    if (!isAdmin) {
      return 'Testnet functionality is restricted to administrators only. All mainnet features remain fully accessible.';
    }
    
    if (!hasPermission('report_viewer')) {
      return `Your admin role (${adminUser?.role?.replace('_', ' ')}) does not have sufficient permissions for testnet access.`;
    }

    return 'Access denied to testnet functionality.';
  };

  /**
   * Check if specific testnet network is accessible
   */
  const canAccessNetwork = (network: 'sepolia' | 'ganache' | 'solana-devnet'): boolean => {
    if (!hasTestnetAccess()) return false;

    // Different networks may require different permission levels
    switch (network) {
      case 'sepolia':
      case 'ganache':
        return hasTestnetAccess(); // Basic testnet access
      case 'solana-devnet':
        return hasAdvancedTestnetAccess(); // Advanced testnet access for Solana
      default:
        return false;
    }
  };

  /**
   * Check if user can perform testnet operations
   */
  const canPerformTestnetOperations = (operation: 'create' | 'import' | 'send' | 'request_tokens'): boolean => {
    if (!hasTestnetAccess()) return false;

    switch (operation) {
      case 'create':
      case 'import':
        return hasTestnetAccess(); // Basic operations
      case 'send':
      case 'request_tokens':
        return hasAdvancedTestnetAccess(); // Advanced operations
      default:
        return false;
    }
  };

  return {
    // Access checks
    hasTestnetAccess,
    hasAdvancedTestnetAccess,
    hasFullTestnetAccess,
    canAccessNetwork,
    canPerformTestnetOperations,
    
    // Status information
    getTestnetAccessStatus,
    getAccessDeniedMessage,
    
    // Loading state
    isLoading,
    
    // Admin information
    isAdmin,
    adminUser,
  };
};

import { supabase } from '@/integrations/supabase/client';
import type {
  AMLCheckRequest,
  AMLCheckResult,
  AMLFormData,
  AMLHistoryFilters,
  AMLRiskLevel,
  BlockchainNetwork,
  AMLFlag,
  AMLSource
} from '@/types/aml';
import { NETWORK_CONFIG } from '@/types/aml';

/**
 * Validate blockchain address format
 */
export const validateAddress = (address: string, chain: BlockchainNetwork): boolean => {
  const config = NETWORK_CONFIG[chain];
  if (!config) return false;
  
  return config.addressPattern.test(address) && 
         config.addressLength.includes(address.length);
};

/**
 * Perform AML check on a blockchain address
 */
export const performAMLCheck = async (
  userId: string,
  formData: AMLFormData
): Promise<{ success: boolean; checkId?: string; error?: string }> => {
  try {
    // Validate address format
    if (!validateAddress(formData.address, formData.chain)) {
      return {
        success: false,
        error: `Invalid ${NETWORK_CONFIG[formData.chain].name} address format`
      };
    }

    // Check if this address was already checked recently (within 24 hours)
    const { data: existingCheck } = await supabase
      .from('aml_checks')
      .select('*')
      .eq('user_id', userId)
      .eq('chain', formData.chain)
      .eq('address', formData.address)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingCheck) {
      console.log('🔄 Using existing AML check result');
      return {
        success: true,
        checkId: existingCheck.id
      };
    }

    // Create new AML check record
    const { data: newCheck, error: insertError } = await supabase
      .from('aml_checks')
      .insert({
        user_id: userId,
        chain: formData.chain,
        address: formData.address,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating AML check:', insertError);
      return {
        success: false,
        error: 'Failed to create AML check request'
      };
    }

    // Perform the actual AML analysis
    const analysisResult = await analyzeAddress(formData.address, formData.chain);
    
    // Update the check with results
    const { error: updateError } = await supabase
      .from('aml_checks')
      .update({
        status: 'completed',
        risk_level: analysisResult.risk_level,
        result: analysisResult
      })
      .eq('id', newCheck.id);

    if (updateError) {
      console.error('Error updating AML check:', updateError);
      return {
        success: false,
        error: 'Failed to save AML check results'
      };
    }

    console.log('✅ AML check completed successfully');
    return {
      success: true,
      checkId: newCheck.id
    };

  } catch (error) {
    console.error('Error performing AML check:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Analyze blockchain address for suspicious activity
 * This is a mock implementation - in production, this would integrate with real AML APIs
 */
const analyzeAddress = async (
  address: string,
  chain: BlockchainNetwork
): Promise<AMLCheckResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock analysis based on address characteristics
  const riskScore = calculateMockRiskScore(address);
  const riskLevel: AMLRiskLevel = riskScore < 30 ? 'low' : riskScore < 70 ? 'medium' : 'high';

  const flags: AMLFlag[] = [];
  const sources: AMLSource[] = [
    {
      name: 'Blockchain Analytics',
      type: 'commercial',
      last_updated: new Date().toISOString(),
      reliability: 95
    },
    {
      name: 'Community Reports',
      type: 'community',
      last_updated: new Date().toISOString(),
      reliability: 75
    }
  ];

  // Add flags based on risk level
  if (riskLevel === 'high') {
    flags.push({
      type: 'scam',
      severity: 'high',
      description: 'Address associated with reported scam activities',
      confidence: 85,
      source: 'Community Reports'
    });
  } else if (riskLevel === 'medium') {
    flags.push({
      type: 'mixer',
      severity: 'medium',
      description: 'Address may be associated with mixing services',
      confidence: 60,
      source: 'Blockchain Analytics'
    });
  }

  const recommendations: string[] = [];
  if (riskLevel === 'high') {
    recommendations.push('Do not proceed with transaction');
    recommendations.push('Report this address if you received it from a suspicious source');
  } else if (riskLevel === 'medium') {
    recommendations.push('Proceed with caution');
    recommendations.push('Verify the source of this address');
    recommendations.push('Consider using smaller amounts for initial transactions');
  } else {
    recommendations.push('Address appears safe for transactions');
    recommendations.push('Continue with normal security practices');
  }

  return {
    address,
    chain,
    risk_level: riskLevel,
    risk_score: riskScore,
    flags,
    analysis: {
      total_transactions: Math.floor(Math.random() * 10000),
      total_volume: Math.floor(Math.random() * 1000000),
      first_seen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      associated_addresses: Math.floor(Math.random() * 100),
      suspicious_patterns: riskLevel === 'high' ? ['Rapid fund movement', 'Multiple small transactions'] : []
    },
    sources,
    recommendations
  };
};

/**
 * Calculate mock risk score based on address characteristics
 */
const calculateMockRiskScore = (address: string): number => {
  let score = 0;
  
  // Simple heuristics for demo purposes
  const addressLower = address.toLowerCase();
  
  // Check for patterns that might indicate higher risk
  if (addressLower.includes('dead') || addressLower.includes('beef')) score += 30;
  if (addressLower.includes('0000')) score += 20;
  if (addressLower.includes('1111') || addressLower.includes('aaaa')) score += 15;
  
  // Add some randomness
  score += Math.floor(Math.random() * 40);
  
  return Math.min(score, 100);
};

/**
 * Get AML check history for a user
 */
export const getAMLHistory = async (
  userId: string,
  filters: AMLHistoryFilters = {},
  limit: number = 10,
  offset: number = 0
): Promise<{ checks: AMLCheckRequest[]; total: number }> => {
  try {
    let query = supabase
      .from('aml_checks')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.chain) {
      query = query.eq('chain', filters.chain);
    }
    if (filters.risk_level) {
      query = query.eq('risk_level', filters.risk_level);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching AML history:', error);
      return { checks: [], total: 0 };
    }

    return {
      checks: data || [],
      total: count || 0
    };

  } catch (error) {
    console.error('Error in getAMLHistory:', error);
    return { checks: [], total: 0 };
  }
};

/**
 * Get a specific AML check by ID
 */
export const getAMLCheck = async (
  userId: string,
  checkId: string
): Promise<AMLCheckRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('aml_checks')
      .select('*')
      .eq('id', checkId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching AML check:', error);
      return null;
    }

    return data;

  } catch (error) {
    console.error('Error in getAMLCheck:', error);
    return null;
  }
};

/**
 * Re-check an address (create a new check)
 */
export const recheckAddress = async (
  userId: string,
  checkId: string
): Promise<{ success: boolean; newCheckId?: string; error?: string }> => {
  try {
    // Get the original check
    const originalCheck = await getAMLCheck(userId, checkId);
    if (!originalCheck) {
      return {
        success: false,
        error: 'Original check not found'
      };
    }

    // Perform new check
    return await performAMLCheck(userId, {
      chain: originalCheck.chain as BlockchainNetwork,
      address: originalCheck.address
    });

  } catch (error) {
    console.error('Error rechecking address:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

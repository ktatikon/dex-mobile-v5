/**
 * Final Validation Suite for Comprehensive UI Redesign
 * 
 * This module validates all implemented changes across the DEX mobile application
 * to ensure consistency, performance, and proper implementation of the new design system.
 */

interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  element?: HTMLElement | null;
}

interface ComprehensiveValidationReport {
  typography: ValidationResult[];
  buttonClassification: ValidationResult[];
  premiumTabStyling: ValidationResult[];
  ambientEffects: ValidationResult[];
  performance: ValidationResult[];
  crossPageConsistency: ValidationResult[];
  overall: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
    score: number;
  };
}

/**
 * Typography Validation - Check Poppins font and medium weights
 */
export const validateTypography = (): ValidationResult[] => {
  const results: ValidationResult[] = [];
  
  // Check if Poppins font is loaded
  const poppinsLoaded = document.fonts.check('16px Poppins');
  results.push({
    category: 'Typography',
    test: 'Poppins Font Loading',
    status: poppinsLoaded ? 'PASS' : 'FAIL',
    details: poppinsLoaded ? 'Poppins font is properly loaded' : 'Poppins font failed to load'
  });
  
  // Check headings for medium weight instead of bold
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let boldHeadingsFound = 0;
  let mediumWeightHeadingsFound = 0;
  
  headings.forEach(heading => {
    const computedStyle = window.getComputedStyle(heading);
    const fontWeight = computedStyle.fontWeight;
    const fontFamily = computedStyle.fontFamily;
    
    if (fontWeight === '700' || fontWeight === 'bold') {
      boldHeadingsFound++;
    } else if (fontWeight === '500' || fontWeight === 'medium') {
      mediumWeightHeadingsFound++;
    }
  });
  
  results.push({
    category: 'Typography',
    test: 'Heading Font Weights',
    status: boldHeadingsFound === 0 ? 'PASS' : 'WARNING',
    details: `Found ${mediumWeightHeadingsFound} medium weight headings, ${boldHeadingsFound} bold headings remaining`
  });
  
  // Check for Poppins font family usage
  const elementsWithPoppins = document.querySelectorAll('.font-poppins');
  results.push({
    category: 'Typography',
    test: 'Poppins Font Usage',
    status: elementsWithPoppins.length > 0 ? 'PASS' : 'FAIL',
    details: `Found ${elementsWithPoppins.length} elements using Poppins font`
  });
  
  return results;
};

/**
 * Button Classification Validation
 */
export const validateButtonClassification = (): ValidationResult[] => {
  const results: ValidationResult[] = [];
  
  // Check for positive action buttons (green glow)
  const positiveButtons = document.querySelectorAll('[data-variant="positive"], .bg-green-500, .shadow-green-500');
  results.push({
    category: 'Button Classification',
    test: 'Positive Action Buttons',
    status: positiveButtons.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${positiveButtons.length} positive action buttons`
  });
  
  // Check for destructive action buttons (red glow)
  const destructiveButtons = document.querySelectorAll('[data-variant="destructive"], .bg-red-500, .shadow-red-500');
  results.push({
    category: 'Button Classification',
    test: 'Destructive Action Buttons',
    status: destructiveButtons.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${destructiveButtons.length} destructive action buttons`
  });
  
  // Check for primary action buttons (dark orange glow)
  const primaryButtons = document.querySelectorAll('[data-variant="default"], [data-variant="glossy"]');
  results.push({
    category: 'Button Classification',
    test: 'Primary Action Buttons',
    status: primaryButtons.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${primaryButtons.length} primary action buttons`
  });
  
  // Check for neutral action buttons
  const neutralButtons = document.querySelectorAll('[data-variant="outline"], [data-variant="ghost"], [data-variant="link"]');
  results.push({
    category: 'Button Classification',
    test: 'Neutral Action Buttons',
    status: neutralButtons.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${neutralButtons.length} neutral action buttons`
  });
  
  return results;
};

/**
 * Premium Tab Styling Validation
 */
export const validatePremiumTabStyling = (): ValidationResult[] => {
  const results: ValidationResult[] = [];
  
  // Check for gradient backgrounds on active tabs
  const gradientTabs = document.querySelectorAll('[class*="from-[#B1420A]"], [class*="to-[#D2691E]"]');
  results.push({
    category: 'Premium Tab Styling',
    test: 'Gradient Tab Backgrounds',
    status: gradientTabs.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${gradientTabs.length} tabs with premium gradient styling`
  });
  
  // Check for 3D shadow effects
  const shadowTabs = document.querySelectorAll('[class*="shadow-[0_6px_12px"]');
  results.push({
    category: 'Premium Tab Styling',
    test: '3D Shadow Effects',
    status: shadowTabs.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${shadowTabs.length} elements with 3D shadow effects`
  });
  
  // Check for hover scale effects
  const scaleElements = document.querySelectorAll('[class*="hover:scale-[1.02]"]');
  results.push({
    category: 'Premium Tab Styling',
    test: 'Hover Scale Effects',
    status: scaleElements.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${scaleElements.length} elements with hover scale effects`
  });
  
  return results;
};

/**
 * Ambient Effects Validation
 */
export const validateAmbientEffects = (): ValidationResult[] => {
  const results: ValidationResult[] = [];
  
  // Check for backdrop blur effects
  const backdropBlurElements = document.querySelectorAll('[class*="backdrop-blur"]');
  results.push({
    category: 'Ambient Effects',
    test: 'Backdrop Blur Effects',
    status: backdropBlurElements.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${backdropBlurElements.length} elements with backdrop blur`
  });
  
  // Check for ambient glow effects
  const glowElements = document.querySelectorAll('[class*="shadow-[0_0_8px"]');
  results.push({
    category: 'Ambient Effects',
    test: 'Ambient Glow Effects',
    status: glowElements.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${glowElements.length} elements with ambient glow`
  });
  
  // Check for frosted glass effects on modals
  const modalElements = document.querySelectorAll('[role="dialog"], .modal');
  let frostedGlassModals = 0;
  modalElements.forEach(modal => {
    const computedStyle = window.getComputedStyle(modal);
    if (computedStyle.backdropFilter && computedStyle.backdropFilter !== 'none') {
      frostedGlassModals++;
    }
  });
  
  results.push({
    category: 'Ambient Effects',
    test: 'Frosted Glass Modals',
    status: frostedGlassModals > 0 ? 'PASS' : 'WARNING',
    details: `Found ${frostedGlassModals} modals with frosted glass effects`
  });
  
  return results;
};

/**
 * Performance Validation
 */
export const validatePerformance = async (): Promise<ValidationResult[]> => {
  const results: ValidationResult[] = [];
  
  // Check animation frame rate
  const fps = await new Promise<number>((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();
    const duration = 1000; // Test for 1 second
    
    const countFrames = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - startTime < duration) {
        requestAnimationFrame(countFrames);
      } else {
        resolve(frameCount);
      }
    };
    
    requestAnimationFrame(countFrames);
  });
  
  results.push({
    category: 'Performance',
    test: 'Animation Frame Rate',
    status: fps >= 55 ? 'PASS' : fps >= 45 ? 'WARNING' : 'FAIL',
    details: `Achieved ${fps} FPS (target: 55+ FPS)`
  });
  
  // Check memory usage
  if ('memory' in performance) {
    const memInfo = (performance as any).memory;
    const memoryEfficiency = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
    
    results.push({
      category: 'Performance',
      test: 'Memory Efficiency',
      status: memoryEfficiency < 80 ? 'PASS' : memoryEfficiency < 90 ? 'WARNING' : 'FAIL',
      details: `Memory usage: ${memoryEfficiency.toFixed(1)}% (target: <80%)`
    });
  }
  
  // Check CSS performance
  const hasGPUAcceleration = CSS.supports('transform', 'translateZ(0)');
  results.push({
    category: 'Performance',
    test: 'GPU Acceleration Support',
    status: hasGPUAcceleration ? 'PASS' : 'WARNING',
    details: hasGPUAcceleration ? 'GPU acceleration is supported' : 'GPU acceleration may not be available'
  });
  
  return results;
};

/**
 * Cross-Page Consistency Validation
 */
export const validateCrossPageConsistency = (): ValidationResult[] => {
  const results: ValidationResult[] = [];
  
  // Check color scheme consistency
  const primaryColorElements = document.querySelectorAll('[class*="#B1420A"], [class*="dex-primary"]');
  results.push({
    category: 'Cross-Page Consistency',
    test: 'Primary Color Usage',
    status: primaryColorElements.length > 0 ? 'PASS' : 'WARNING',
    details: `Found ${primaryColorElements.length} elements using primary color scheme`
  });
  
  // Check font consistency
  const poppinsElements = document.querySelectorAll('.font-poppins');
  const totalTextElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, label');
  const poppinsUsagePercentage = (poppinsElements.length / totalTextElements.length) * 100;
  
  results.push({
    category: 'Cross-Page Consistency',
    test: 'Font Consistency',
    status: poppinsUsagePercentage > 70 ? 'PASS' : poppinsUsagePercentage > 50 ? 'WARNING' : 'FAIL',
    details: `${poppinsUsagePercentage.toFixed(1)}% of text elements use Poppins font`
  });
  
  // Check button styling consistency
  const styledButtons = document.querySelectorAll('button[class*="shadow"], button[class*="gradient"]');
  const totalButtons = document.querySelectorAll('button');
  const buttonStylingPercentage = (styledButtons.length / totalButtons.length) * 100;
  
  results.push({
    category: 'Cross-Page Consistency',
    test: 'Button Styling Consistency',
    status: buttonStylingPercentage > 60 ? 'PASS' : buttonStylingPercentage > 40 ? 'WARNING' : 'FAIL',
    details: `${buttonStylingPercentage.toFixed(1)}% of buttons have enhanced styling`
  });
  
  return results;
};

/**
 * Run Comprehensive Validation
 */
export const runComprehensiveValidation = async (): Promise<ComprehensiveValidationReport> => {
  console.log('🔍 Starting Comprehensive UI Redesign Validation...');
  
  const typography = validateTypography();
  const buttonClassification = validateButtonClassification();
  const premiumTabStyling = validatePremiumTabStyling();
  const ambientEffects = validateAmbientEffects();
  const performance = await validatePerformance();
  const crossPageConsistency = validateCrossPageConsistency();
  
  const allResults = [
    ...typography,
    ...buttonClassification,
    ...premiumTabStyling,
    ...ambientEffects,
    ...performance,
    ...crossPageConsistency
  ];
  
  const totalTests = allResults.length;
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const failed = allResults.filter(r => r.status === 'FAIL').length;
  const warnings = allResults.filter(r => r.status === 'WARNING').length;
  const score = Math.round((passed / totalTests) * 100);
  
  const report: ComprehensiveValidationReport = {
    typography,
    buttonClassification,
    premiumTabStyling,
    ambientEffects,
    performance,
    crossPageConsistency,
    overall: {
      totalTests,
      passed,
      failed,
      warnings,
      score
    }
  };
  
  console.log('📊 Validation Complete:', report.overall);
  
  return report;
};

export default {
  runComprehensiveValidation,
  validateTypography,
  validateButtonClassification,
  validatePremiumTabStyling,
  validateAmbientEffects,
  validatePerformance,
  validateCrossPageConsistency
};

/**
 * Environment Variable Test Utility
 * 
 * This utility helps debug environment variable loading issues
 */

export function logEnvironmentVariables() {
  console.log('🔧 Environment Variables Debug:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('REACT_APP_USE_CHART_MICROSERVICE:', process.env.REACT_APP_USE_CHART_MICROSERVICE);
  console.log('REACT_APP_CHART_API_URL:', process.env.REACT_APP_CHART_API_URL);
  console.log('REACT_APP_DEBUG_CHART_SERVICE:', process.env.REACT_APP_DEBUG_CHART_SERVICE);
  
  // Test the boolean conversion
  const microserviceEnabled = process.env.REACT_APP_USE_CHART_MICROSERVICE === 'true';
  console.log('Microservice enabled (boolean):', microserviceEnabled);
  
  return {
    nodeEnv: process.env.NODE_ENV,
    microserviceEnabled,
    chartApiUrl: process.env.REACT_APP_CHART_API_URL,
    debugEnabled: process.env.REACT_APP_DEBUG_CHART_SERVICE === 'true'
  };
}

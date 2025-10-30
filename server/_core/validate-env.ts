/**
 * Environment Variables Validation
 * 
 * This script validates that all required environment variables
 * are properly configured for production deployment.
 */

import 'dotenv/config';
import { ENV } from './env';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical variables (deployment will fail without these)
  const criticalVars = [
    { key: 'DATABASE_URL', value: ENV.databaseUrl, description: 'Database connection string' },
    { key: 'JWT_SECRET', value: ENV.cookieSecret, description: 'JWT secret for session cookies' },
    { key: 'VITE_APP_ID', value: ENV.appId, description: 'Application ID for OAuth' },
    { key: 'OAUTH_SERVER_URL', value: ENV.oAuthServerUrl, description: 'OAuth server URL' },
  ];

  // Optional but recommended variables
  const optionalVars = [
    { key: 'OWNER_OPEN_ID', value: ENV.ownerOpenId, description: 'Owner OpenID for admin access' },
    { key: 'BUILT_IN_FORGE_API_URL', value: ENV.forgeApiUrl, description: 'Forge API URL' },
    { key: 'BUILT_IN_FORGE_API_KEY', value: ENV.forgeApiKey, description: 'Forge API Key' },
    { key: 'PORT', value: process.env.PORT, description: 'Server port (defaults to 3000)' },
  ];

  // Check critical variables
  criticalVars.forEach(({ key, value, description }) => {
    if (!value || value.trim() === '') {
      errors.push(`❌ ${key} is required but not set. ${description}`);
    } else {
      console.log(`✅ ${key}: configured`);
    }
  });

  // Check optional variables
  optionalVars.forEach(({ key, value, description }) => {
    if (!value || value.trim() === '') {
      warnings.push(`⚠️  ${key} is not set. ${description}`);
    } else {
      console.log(`✅ ${key}: configured`);
    }
  });

  // Validate DATABASE_URL format
  if (ENV.databaseUrl) {
    if (!ENV.databaseUrl.startsWith('mysql://')) {
      errors.push(`❌ DATABASE_URL must start with 'mysql://' for MySQL connections`);
    }
  }

  // Validate JWT_SECRET strength
  if (ENV.cookieSecret) {
    if (ENV.cookieSecret.length < 32) {
      warnings.push(`⚠️  JWT_SECRET should be at least 32 characters long for security`);
    }
    if (ENV.cookieSecret === 'your-jwt-secret-change-in-production') {
      errors.push(`❌ JWT_SECRET is still set to the default example value`);
    }
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'production') {
    warnings.push(`⚠️  NODE_ENV is not set to 'production' (current: ${process.env.NODE_ENV || 'undefined'})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Print validation results
 */
export function printValidationResults(result: ValidationResult): void {
  console.log('\n🔍 Environment Variables Validation');
  console.log('='.repeat(50));

  if (result.errors.length > 0) {
    console.log('\n❌ CRITICAL ERRORS:');
    result.errors.forEach(error => console.log(`  ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(warning => console.log(`  ${warning}`));
  }

  if (result.isValid) {
    console.log('\n✅ All critical environment variables are configured!');
  } else {
    console.log('\n❌ Environment validation failed. Please fix the errors above.');
  }

  console.log('='.repeat(50));
}

// Run validation if called directly
const result = validateEnvironment();
printValidationResults(result);
process.exit(result.isValid ? 0 : 1);
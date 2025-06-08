export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
  forbidPersonalInfo: boolean;
  minUniqueChars: number;
}

// Default strong password policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbidCommonPasswords: true,
  forbidPersonalInfo: true,
  minUniqueChars: 8,
};

// Common weak passwords to reject
const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'iloveyou', '1234567', '12345678', 'sunshine', 'master', 'shadow',
  'ashley', 'football', 'jesus', 'michael', 'ninja', 'mustang',
  'password!', 'Password1', 'Password123', '123Password', 'Admin123',
]);

export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  personalInfo?: { name?: string; email?: string }
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  } else {
    score += Math.min(password.length * 2, 20);
  }

  // Check character requirements
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 5;
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 5;
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 5;
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 10;
  }

  // Check for common passwords
  if (policy.forbidCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common and easily guessable');
    score -= 20;
  }

  // Check for personal information
  if (policy.forbidPersonalInfo && personalInfo) {
    const lowerPassword = password.toLowerCase();
    if (personalInfo.name && lowerPassword.includes(personalInfo.name.toLowerCase())) {
      errors.push('Password must not contain your name');
      score -= 10;
    }
    if (personalInfo.email) {
      const emailPart = personalInfo.email.split('@')[0]?.toLowerCase();
      if (emailPart && lowerPassword.includes(emailPart)) {
        errors.push('Password must not contain parts of your email');
        score -= 10;
      }
    }
  }

  // Check unique characters
  const uniqueChars = new Set(password).size;
  if (uniqueChars < policy.minUniqueChars) {
    errors.push(`Password must contain at least ${policy.minUniqueChars} unique characters`);
  } else {
    score += uniqueChars;
  }

  // Additional entropy checks
  if (password.length > 15) score += 5;
  if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 5; // Multiple special chars
  if (!/(.)\1{2,}/.test(password)) score += 5; // No repeated characters

  // Penalize patterns
  if (/123|abc|qwe|asd|zxc/i.test(password)) score -= 10;
  if (/^(.)\1+$/.test(password)) score -= 30; // All same character

  // Determine strength
  score = Math.max(0, Math.min(100, score));
  let strength: PasswordValidationResult['strength'];
  
  if (score < 30) strength = 'weak';
  else if (score < 60) strength = 'medium';
  else if (score < 80) strength = 'strong';
  else strength = 'very-strong';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

export function generatePasswordSuggestion(): string {
  const adjectives = ['Swift', 'Bright', 'Clever', 'Strong', 'Brave', 'Quick', 'Smart', 'Bold'];
  const nouns = ['Tiger', 'Eagle', 'Storm', 'River', 'Mountain', 'Ocean', 'Forest', 'Galaxy'];
  const numbers = Math.floor(Math.random() * 9999) + 1000;
  const symbols = ['!', '@', '#', '$', '%', '^', '&', '*'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  
  return `${adjective}${noun}${numbers}${symbol}`;
} 
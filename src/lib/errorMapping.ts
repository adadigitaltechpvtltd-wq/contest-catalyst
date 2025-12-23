/**
 * Centralized error mapping utility for user-friendly error messages.
 * This prevents exposing internal database structure, constraint names,
 * and implementation details to users.
 */

export function getUserFriendlyError(error: unknown): string {
  const msg = ((error as { message?: string })?.message || '').toLowerCase();
  
  // Database constraint violations
  if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('_key')) {
    return 'This information is already in use.';
  }
  if (msg.includes('foreign key') || msg.includes('violates foreign key')) {
    return 'Unable to complete operation due to related records.';
  }
  if (msg.includes('check constraint') || msg.includes('check_')) {
    return 'The provided value does not meet requirements.';
  }
  if (msg.includes('not-null') || msg.includes('null value') || msg.includes('violates not-null')) {
    return 'Required information is missing.';
  }
  
  // Row Level Security
  if (msg.includes('row-level security') || msg.includes('rls')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Auth errors (Supabase specific)
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return 'Invalid email or password.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please verify your email before signing in.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('too short'))) {
    return 'Password is too weak. Please use a stronger password.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  
  // Storage errors
  if (msg.includes('payload too large') || msg.includes('file size')) {
    return 'The file is too large. Please upload a smaller file.';
  }
  if (msg.includes('invalid mime type') || msg.includes('mime type')) {
    return 'Invalid file type. Please upload an allowed file format.';
  }
  if (msg.includes('bucket') && msg.includes('not found')) {
    return 'Storage configuration error. Please contact support.';
  }
  
  // Network errors
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (msg.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // Generic fallback
  return 'An error occurred. Please try again or contact support.';
}

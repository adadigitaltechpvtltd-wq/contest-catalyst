/**
 * Minimal SEO utilities
 */

const BASE_URL = 'https://gaal.app';

/**
 * Generate canonical URL for a photo
 */
export const getPhotoCanonicalUrl = (contestSlug: string, photoSlug: string): string => {
  return `${BASE_URL}/photo/${contestSlug}/${photoSlug}`;
};

/**
 * Generate canonical URL for a contest
 */
export const getContestCanonicalUrl = (contestSlug: string): string => {
  return `${BASE_URL}/contest/${contestSlug}`;
};
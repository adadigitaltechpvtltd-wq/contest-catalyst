/**
 * SEO utilities for URL generation
 */

const BASE_URL = 'https://gaal.app';

/**
 * Generate canonical URL for a gallery photo (with category)
 */
export const getGalleryCanonicalUrl = (category: string, contestSlug: string, photoSlug: string): string => {
  return `${BASE_URL}/gallery/${category}/${contestSlug}/${photoSlug}`;
};

/**
 * Generate canonical URL for a contest (with category)
 */
export const getContestCanonicalUrl = (category: string, contestSlug: string): string => {
  return `${BASE_URL}/contest/${category}/${contestSlug}`;
};

/**
 * Legacy URL for redirects - photo
 */
export const getLegacyPhotoUrl = (contestSlug: string, photoSlug: string): string => {
  return `${BASE_URL}/photo/${contestSlug}/${photoSlug}`;
};

/**
 * Legacy URL for redirects - contest (without category)
 */
export const getLegacyContestUrl = (contestSlug: string): string => {
  return `${BASE_URL}/contest/${contestSlug}`;
};
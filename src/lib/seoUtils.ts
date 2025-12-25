/**
 * SEO utilities for generating structured data and metadata
 */

const BASE_URL = 'https://gaal.app';

export const generateContestStructuredData = (contest: {
  title: string;
  description?: string | null;
  slug?: string;
  start_date: string;
  end_date: string;
  prize_amount: number;
  prize_currency: string;
  cover_image_url?: string | null;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: contest.title,
    description: contest.description || `Photography contest: ${contest.title}`,
    startDate: contest.start_date,
    endDate: contest.end_date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: `${BASE_URL}/contest/${contest.slug}`,
    },
    image: contest.cover_image_url || `${BASE_URL}/og-contest.jpg`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: contest.start_date,
    },
    organizer: {
      '@type': 'Organization',
      name: 'GAAL',
      url: BASE_URL,
    },
    maximumAttendeeCapacity: 10000,
    prizeAmount: {
      '@type': 'MonetaryAmount',
      value: contest.prize_amount,
      currency: contest.prize_currency,
    },
  };
};

export const generatePhotoStructuredData = (photo: {
  title: string;
  description?: string | null;
  image_url: string;
  slug?: string;
  created_at: string;
  view_count?: number;
  like_count?: number;
  download_count?: number;
  contest_slug?: string;
  contest_title?: string;
  photographer_name?: string;
  tags?: string[];
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: photo.title,
    description: photo.description || `Photography submission: ${photo.title}`,
    contentUrl: photo.image_url,
    thumbnailUrl: photo.image_url,
    uploadDate: photo.created_at,
    author: {
      '@type': 'Person',
      name: photo.photographer_name || 'Anonymous',
    },
    ...(photo.contest_title && {
      isPartOf: {
        '@type': 'CreativeWork',
        name: photo.contest_title,
        url: `${BASE_URL}/contest/${photo.contest_slug}`,
      },
    }),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: photo.view_count || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: photo.like_count || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/DownloadAction',
        userInteractionCount: photo.download_count || 0,
      },
    ],
    ...(photo.tags && photo.tags.length > 0 && {
      keywords: photo.tags.join(', '),
    }),
  };
};

export const generateBreadcrumbStructuredData = (items: { name: string; url: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

export const generateOrganizationStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GAAL',
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
    sameAs: [
      'https://twitter.com/GAAL',
      'https://instagram.com/GAAL',
      'https://facebook.com/GAAL',
    ],
    description: 'GAAL is a photography contest platform where creators compete, showcase their work, and win prizes.',
  };
};

/**
 * Generates a slug-safe URL from a title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Validates SEO title length
 */
export const validateSEOTitle = (title: string): { valid: boolean; message: string } => {
  if (title.length < 10) {
    return { valid: false, message: 'Title should be at least 10 characters' };
  }
  if (title.length > 60) {
    return { valid: false, message: 'Title should be under 60 characters for SEO' };
  }
  return { valid: true, message: 'Good title length' };
};

/**
 * Validates SEO description length
 */
export const validateSEODescription = (description: string): { valid: boolean; message: string } => {
  if (description.length < 100) {
    return { valid: false, message: 'Description should be at least 100 characters' };
  }
  if (description.length > 160) {
    return { valid: false, message: 'Description should be under 160 characters for SEO' };
  }
  return { valid: true, message: 'Good description length' };
};

/**
 * Generic SEO title patterns to reject
 */
const GENERIC_TITLES = [
  'my photo',
  'image 1',
  'image 2',
  'photo 1',
  'photo 2',
  'untitled',
  'test',
  'pic',
  'picture',
  'img',
  'screenshot',
  'capture',
  'dsc_',
  'img_',
  '_dsc',
];

/**
 * Check if title is too generic for SEO
 */
export const isTitleGeneric = (title: string): boolean => {
  const lowerTitle = title.toLowerCase().trim();
  return GENERIC_TITLES.some(generic => 
    lowerTitle === generic || 
    lowerTitle.startsWith(generic) ||
    /^(dsc|img|image|photo|pic)[\s_-]?\d+$/i.test(lowerTitle)
  );
};

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

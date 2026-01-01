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
 * Generate canonical URL for a campaign (with category)
 */
export const getContestCanonicalUrl = (category: string, contestSlug: string): string => {
  return `${BASE_URL}/campaign/${category}/${contestSlug}`;
};

/**
 * Legacy URL for redirects - photo
 */
export const getLegacyPhotoUrl = (contestSlug: string, photoSlug: string): string => {
  return `${BASE_URL}/photo/${contestSlug}/${photoSlug}`;
};

/**
 * Legacy URL for redirects - campaign (without category)
 */
export const getLegacyContestUrl = (contestSlug: string): string => {
  return `${BASE_URL}/campaign/${contestSlug}`;
};

/**
 * Generate breadcrumb structured data for photo pages
 */
export const getPhotoBreadcrumbSchema = (
  category: string,
  contestSlug: string,
  contestTitle: string,
  photoSlug: string,
  photoTitle: string
) => {
  const formattedCategory = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": BASE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Gallery",
        "item": `${BASE_URL}/gallery`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": formattedCategory,
        "item": `${BASE_URL}/gallery?category=${category}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": contestTitle,
        "item": `${BASE_URL}/campaign/${category}/${contestSlug}`
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": photoTitle,
        "item": `${BASE_URL}/gallery/${category}/${contestSlug}/${photoSlug}`
      }
    ]
  };
};

/**
 * Generate contest structured data
 */
export const getContestSchema = (
  contest: {
    title: string;
    description: string | null;
    theme: string | null;
    prize_amount: number;
    prize_currency: string;
    start_date: string;
    end_date: string;
    cover_image_url: string | null;
    brand_name: string | null;
  },
  category: string,
  contestSlug: string
) => {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": contest.title,
    "description": contest.description || `${contest.title} photography campaign on GAAL`,
    "startDate": contest.start_date,
    "endDate": contest.end_date,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "location": {
      "@type": "VirtualLocation",
      "url": getContestCanonicalUrl(category, contestSlug)
    },
    "image": contest.cover_image_url || `${BASE_URL}/og-image.png`,
    "organizer": {
      "@type": "Organization",
      "name": contest.brand_name || "GAAL",
      "url": BASE_URL
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": contest.prize_currency,
      "availability": "https://schema.org/InStock",
      "validFrom": contest.start_date
    }
  };
};

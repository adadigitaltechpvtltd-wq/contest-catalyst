/**
 * SEO utilities for URL generation
 */

const BASE_URL = 'https://gaal.app';

/**
 * Generate canonical URL for a gallery photo (with category)
 */
export const getGalleryCanonicalUrl = (category: string, campaignSlug: string, photoSlug: string): string => {
  return `${BASE_URL}/gallery/${category}/${campaignSlug}/${photoSlug}`;
};

/**
 * Generate canonical URL for a campaign (with category)
 */
export const getCampaignCanonicalUrl = (category: string, campaignSlug: string): string => {
  return `${BASE_URL}/campaign/${category}/${campaignSlug}`;
};

// Legacy alias
export const getContestCanonicalUrl = getCampaignCanonicalUrl;

/**
 * Legacy URL for redirects - photo
 */
export const getLegacyPhotoUrl = (campaignSlug: string, photoSlug: string): string => {
  return `${BASE_URL}/photo/${campaignSlug}/${photoSlug}`;
};

/**
 * Legacy URL for redirects - campaign (without category)
 */
export const getLegacyCampaignUrl = (campaignSlug: string): string => {
  return `${BASE_URL}/campaign/${campaignSlug}`;
};

// Legacy alias
export const getLegacyContestUrl = getLegacyCampaignUrl;

/**
 * Generate breadcrumb structured data for photo pages
 */
export const getPhotoBreadcrumbSchema = (
  category: string,
  campaignSlug: string,
  campaignTitle: string,
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
        "name": campaignTitle,
        "item": `${BASE_URL}/campaign/${category}/${campaignSlug}`
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": photoTitle,
        "item": `${BASE_URL}/gallery/${category}/${campaignSlug}/${photoSlug}`
      }
    ]
  };
};

/**
 * Generate campaign structured data
 */
export const getCampaignSchema = (
  campaign: {
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
  campaignSlug: string
) => {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": campaign.title,
    "description": campaign.description || `${campaign.title} photography campaign on GAAL`,
    "startDate": campaign.start_date,
    "endDate": campaign.end_date,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "location": {
      "@type": "VirtualLocation",
      "url": getCampaignCanonicalUrl(category, campaignSlug)
    },
    "image": campaign.cover_image_url || `${BASE_URL}/og-image.png`,
    "organizer": {
      "@type": "Organization",
      "name": campaign.brand_name || "GAAL",
      "url": BASE_URL
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": campaign.prize_currency,
      "availability": "https://schema.org/InStock",
      "validFrom": campaign.start_date
    }
  };
};

// Legacy alias
export const getContestSchema = getCampaignSchema;

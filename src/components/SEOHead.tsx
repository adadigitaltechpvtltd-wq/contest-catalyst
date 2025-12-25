import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
}

const SEOHead = ({
  title,
  description,
  canonicalUrl,
  ogImage = 'https://lovable.dev/opengraph-image-p98pqg.png',
  ogType = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const siteName = 'GAAL';
  const fullTitle = title.includes('GAAL') ? title : `${title} | ${siteName}`;
  const truncatedDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={truncatedDescription} />
      
      {/* Indexing Control */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEOHead;

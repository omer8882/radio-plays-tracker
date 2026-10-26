import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'מה הושמע ברדיו';
const ORIGIN = 'https://mahushma.com';

/**
 * Per-route title, description, canonical and structured data.
 *
 * Note the honest limit: React injects these on the client, so they only reach a
 * crawler that executes JavaScript. That is the point of the prerender step -
 * getting the tags right is a prerequisite for it, not a substitute.
 */
const PageMeta = ({ title, description, path, image, jsonLd, noIndex = false }) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonical = path ? `${ORIGIN}${path}` : ORIGIN;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <link rel="canonical" href={canonical} />
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:url" content={canonical} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export { ORIGIN, SITE_NAME };
export default PageMeta;

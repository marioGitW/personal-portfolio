/**
 * GROQ lives here, never inline in components.
 *
 * Asset references are dereferenced to plain URLs in the query itself
 * (`asset->url`). That keeps one code path for both image assets (thumbnails,
 * screenshots) and file assets (experience/skill icons, which may be SVG), and
 * means client components receive strings rather than raw Sanity refs.
 */

const IMAGE_FIELDS = `
  "url": asset->url,
  "lqip": asset->metadata.lqip,
  "aspectRatio": asset->metadata.dimensions.aspectRatio
`;

export const portfolioQuery = /* groq */ `
*[_type == "portfolio"][0]{
  hero{
    roleTag,
    mainTitle,
    subtitle
  },
  about{
    description,
    tags[]{
      _key,
      highlightedText,
      description
    }
  },
  experience{
    experienceDescription,
    experienceItems[]{
      _key,
      order,
      name,
      place,
      position,
      type,
      keyFeatures,
      durationMonths,
      durationLabel,
      "iconUrl": icon.asset->url,
      "iconMimeType": icon.asset->mimeType
    }
  },
  skills{
    skillItems[]{
      _key,
      title,
      deviconPath,
      "iconUrl": icon.asset->url,
      "iconMimeType": icon.asset->mimeType
    }
  },
  social{
    socialLinks[]{
      _key,
      platform,
      linkType,
      value,
      label,
      "iconUrl": icon.asset->url,
      "iconMimeType": icon.asset->mimeType
    }
  }
}
`;

/**
 * `coalesce(order, 9999)` keeps projects that have no `order` from breaking the
 * sort — they fall to the end instead of being dropped or ordered randomly.
 * `_createdAt` is the tiebreaker so equal/absent orders stay stable.
 */
export const projectsQuery = /* groq */ `
*[_type == "project"] | order(coalesce(order, 9999) asc, _createdAt asc){
  _id,
  order,
  title,
  "slug": slug.current,
  featured,
  thumbnailTag,
  thumbnailTitle,
  thumbnailDescription,
  thumbnail{${IMAGE_FIELDS}},
  screenshots[]{
    _key,
    ${IMAGE_FIELDS}
  },
  demoVideoUrl,
  techStack,
  projectOverview,
  keyFeatures,
  liveProjectUrl,
  sourceCodeUrl
}
`;

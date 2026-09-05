// Assets are dereferenced to plain URLs here (asset->url), so one code path
// covers both image assets and SVG file assets and components get strings.

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

// coalesce sinks projects with no order to the end instead of dropping them;
// _createdAt keeps equal orders stable.
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
  seoDescription,
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

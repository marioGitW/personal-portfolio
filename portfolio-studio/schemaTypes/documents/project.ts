import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    {name: 'card', title: 'Card', default: true},
    {name: 'media', title: 'Media'},
    {name: 'details', title: 'Details'},
    {name: 'links', title: 'Links'},
  ],
  fields: [
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      group: 'card',
      description:
        'Controls where this project appears in the Projects section. Lower numbers appear first (1, 2, 3 …).',
      validation: (Rule) => Rule.integer().greaterThan(0),
    }),
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      group: 'card',
      description: 'Internal/primary name for the project. Also used to generate the slug.',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'card',
      description:
        'URL-friendly id, generated from the title. Not used yet — projects open in a modal — but reserved for a future /projects/[slug] page.',
      options: {source: 'title', maxLength: 96},
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'card',
      description: 'Marks the project as featured. No frontend behaviour is attached to this yet.',
      initialValue: false,
    }),

    // ---- Card fields. These are the single source of truth: the expanded
    // ---- project/modal view reuses the same tag, title and description.
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      group: 'card',
      description: 'Cover image for the project card.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'thumbnailTag',
      title: 'Tag',
      type: 'string',
      group: 'card',
      description:
        'Short category label shown on the card, and reused in the expanded view. Example: "Full Stack".',
    }),
    defineField({
      name: 'thumbnailTitle',
      title: 'Display Title',
      type: 'string',
      group: 'card',
      description: 'The title shown on the card and in the expanded view.',
    }),
    defineField({
      name: 'thumbnailDescription',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      group: 'card',
      description: 'Brief summary shown on the card and in the expanded view.',
    }),

    defineField({
      name: 'screenshots',
      title: 'Screenshots',
      type: 'array',
      group: 'media',
      description:
        'Additional images for the expanded view. May be rendered as a gallery, carousel or slider.',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
      options: {layout: 'grid'},
    }),
    defineField({
      name: 'demoVideoUrl',
      title: 'Demo Video URL',
      type: 'url',
      group: 'media',
      description: 'YouTube, Vimeo or any other hosted video URL.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'techStack',
      title: 'Tech Stack',
      type: 'array',
      group: 'details',
      description:
        'Technologies used. Type one and press Enter to turn it into a tag, then type the next — no quotes, no commas. Anything left untagged in the box is not saved. Examples: React, TypeScript, Spring Boot, PostgreSQL.',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'projectOverview',
      title: 'Project Overview',
      type: 'text',
      rows: 8,
      group: 'details',
      description: 'The main description shown in the expanded project view.',
    }),
    defineField({
      name: 'keyFeatures',
      title: 'Key Features',
      type: 'array',
      group: 'details',
      description: 'Bullet points describing what the project does. Rendered as a list.',
      of: [defineArrayMember({type: 'string'})],
    }),

    defineField({
      name: 'liveProjectUrl',
      title: 'Live Project URL',
      type: 'url',
      group: 'links',
      description: 'Link to the deployed project. Leave empty if there is no live demo.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'sourceCodeUrl',
      title: 'Source Code URL',
      type: 'url',
      group: 'links',
      description: 'Link to the repository. Leave empty if the source is not public.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'displayOrderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Title A–Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      thumbnailTitle: 'thumbnailTitle',
      tag: 'thumbnailTag',
      order: 'order',
      media: 'thumbnail',
    },
    prepare({title, thumbnailTitle, tag, order, media}) {
      const prefix = typeof order === 'number' ? `${order}. ` : ''
      return {
        title: `${prefix}${title || thumbnailTitle || 'Untitled project'}`,
        subtitle: tag || undefined,
        media,
      }
    },
  },
})

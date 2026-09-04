import {defineArrayMember, defineField, defineType} from 'sanity'
import {defineIconField} from '../shared/icon'

export default defineType({
  name: 'experienceItem',
  title: 'Experience Item',
  type: 'object',
  fields: [
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description:
        'Controls the order this entry appears in. Lower numbers appear first (1, 2, 3 …). The frontend sorts on this value, not on the position in this list.',
      validation: (Rule) => Rule.integer().greaterThan(0),
    }),
    defineIconField('Company/organisation logo. Accepts SVG, PNG, JPG and JPEG.'),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Company or organisation name. Examples: "Endava", "Motion Source".',
    }),
    defineField({
      name: 'place',
      title: 'Work Place',
      type: 'string',
      description: 'Where the work was carried out.',
      options: {
        list: [
          {title: 'On-site', value: 'On-site'},
          {title: 'Remote', value: 'Remote'},
          {title: 'Hybrid', value: 'Hybrid'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      description: 'Job title. Examples: "Software Engineering Intern", "Web Developer Intern".',
    }),
    defineField({
      name: 'type',
      title: 'Employment Type',
      type: 'string',
      description:
        'Free text so any value works. Examples: "Internship", "Full-time", "Part-time", "Freelance", "Contract", "Volunteer".',
    }),
    defineField({
      name: 'keyFeatures',
      title: 'Key Features',
      type: 'array',
      description: 'Bullet points describing the role. Rendered as a list on the frontend.',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'durationMonths',
      title: 'Duration (months)',
      type: 'number',
      description:
        'Numeric value only — enter 1, 2, 6 … The frontend decides whether to show "month" or "months".',
      validation: (Rule) => Rule.greaterThan(0),
    }),
  ],
  preview: {
    select: {
      name: 'name',
      position: 'position',
      order: 'order',
      media: 'icon',
    },
    prepare({name, position, order, media}) {
      const prefix = typeof order === 'number' ? `${order}. ` : ''
      return {
        title: `${prefix}${name || 'Untitled experience'}`,
        subtitle: position || undefined,
        media,
      }
    },
  },
})

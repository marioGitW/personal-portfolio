import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'roleTag',
      title: 'Role Tag',
      type: 'string',
      description:
        'Small label sitting above the main title. Example: "ASPIRING SOFTWARE ENGINEER".',
    }),
    defineField({
      name: 'mainTitle',
      title: 'Main Title',
      type: 'string',
      description: 'The large hero headline. Example: "MARIO SPASOVSKI".',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      rows: 3,
      description:
        'Short supporting line under the title. Example: "Curious about technology. Passionate about building things that make sense."',
    }),
  ],
  preview: {
    select: {title: 'mainTitle', subtitle: 'roleTag'},
    prepare({title, subtitle}) {
      return {title: title || 'Hero', subtitle: subtitle || undefined}
    },
  },
})

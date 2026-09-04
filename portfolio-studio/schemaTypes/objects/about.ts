import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'about',
  title: 'About',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 8,
      description: 'The full About Me copy. Line breaks are preserved.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      description:
        'Short stat-style tags shown alongside the About copy. Add as many as you like — the frontend renders however many exist.',
      of: [defineArrayMember({type: 'aboutTag'})],
    }),
  ],
  preview: {
    select: {description: 'description', tags: 'tags'},
    prepare({description, tags}) {
      const count = Array.isArray(tags) ? tags.length : 0
      return {
        title: 'About',
        subtitle: description || `${count} tag${count === 1 ? '' : 's'}`,
      }
    },
  },
})

import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'experience',
  title: 'Experience',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'experienceDescription',
      title: 'Section Description',
      type: 'text',
      rows: 4,
      description: 'Paragraph shown underneath the Experience section title.',
    }),
    defineField({
      name: 'experienceItems',
      title: 'Experience Items',
      type: 'array',
      description:
        'Each entry has its own "Display Order" number — that is what the frontend sorts by, so the order here in the Studio does not matter.',
      of: [defineArrayMember({type: 'experienceItem'})],
    }),
  ],
  preview: {
    select: {items: 'experienceItems'},
    prepare({items}) {
      const count = Array.isArray(items) ? items.length : 0
      return {title: 'Experience', subtitle: `${count} item${count === 1 ? '' : 's'}`}
    },
  },
})

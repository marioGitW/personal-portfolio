import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'social',
  title: 'Social',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      description:
        'Shown in the left sidebar and in the footer. Drag to reorder — the site renders them in this order.',
      of: [defineArrayMember({type: 'socialLink'})],
    }),
  ],
  preview: {
    select: {links: 'socialLinks'},
    prepare({links}) {
      const count = Array.isArray(links) ? links.length : 0
      return {title: 'Social', subtitle: `${count} link${count === 1 ? '' : 's'}`}
    },
  },
})

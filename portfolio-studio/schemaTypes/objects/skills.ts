import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'skills',
  title: 'Skills',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'skillItems',
      title: 'Skill Items',
      type: 'array',
      description: 'Add as many technologies as you like — there is no limit.',
      of: [defineArrayMember({type: 'skillItem'})],
    }),
  ],
  preview: {
    select: {items: 'skillItems'},
    prepare({items}) {
      const count = Array.isArray(items) ? items.length : 0
      return {title: 'Skills', subtitle: `${count} skill${count === 1 ? '' : 's'}`}
    },
  },
})

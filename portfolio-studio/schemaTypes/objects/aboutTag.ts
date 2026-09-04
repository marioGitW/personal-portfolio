import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'aboutTag',
  title: 'About Tag',
  type: 'object',
  fields: [
    defineField({
      name: 'highlightedText',
      title: 'Highlighted Text',
      type: 'string',
      description: 'The emphasised part of the tag. Example: "22" or "4th".',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'The supporting label. Example: "Years Old" or "Year Student".',
    }),
  ],
  preview: {
    select: {highlightedText: 'highlightedText', description: 'description'},
    prepare({highlightedText, description}) {
      return {
        title: [highlightedText, description].filter(Boolean).join(' ') || 'Empty tag',
      }
    },
  },
})

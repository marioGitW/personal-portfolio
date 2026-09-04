import {defineField, defineType} from 'sanity'

/**
 * Singleton. Exactly one document of this type exists, pinned to the document
 * id declared in `../../structure.ts`. Creation of further copies is blocked in
 * `sanity.config.ts` via the initial-value template filter.
 */
export default defineType({
  name: 'portfolio',
  title: 'Portfolio',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'about', title: 'About'},
    {name: 'experience', title: 'Experience'},
    {name: 'skills', title: 'Skills'},
    {name: 'social', title: 'Social'},
  ],
  fields: [
    defineField({name: 'hero', title: 'Hero', type: 'hero', group: 'hero'}),
    defineField({name: 'about', title: 'About', type: 'about', group: 'about'}),
    defineField({
      name: 'experience',
      title: 'Experience',
      type: 'experience',
      group: 'experience',
    }),
    defineField({name: 'skills', title: 'Skills', type: 'skills', group: 'skills'}),
    defineField({name: 'social', title: 'Social', type: 'social', group: 'social'}),
  ],
  preview: {
    select: {mainTitle: 'hero.mainTitle'},
    prepare({mainTitle}) {
      return {title: 'Portfolio', subtitle: mainTitle || 'Site-wide content'}
    },
  },
})

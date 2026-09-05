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
    // A file field rather than an image one: the CV is a PDF, which Sanity's
    // image pipeline neither accepts nor transforms.
    defineField({
      name: 'resume',
      title: 'Resume (PDF)',
      type: 'file',
      description:
        'The CV behind the "View Resume" button in the hero. Upload a PDF and it goes live within a minute — no code change, no redeploy. Visitors read it inline in a modal and can download it, so upload the version you are happy to share publicly. Replacing the file here replaces it everywhere. Leave this empty and the "View Resume" button is hidden entirely.',
      options: {accept: '.pdf,application/pdf', storeOriginalFilename: true},
    }),
  ],
  preview: {
    select: {title: 'mainTitle', subtitle: 'roleTag'},
    prepare({title, subtitle}) {
      return {title: title || 'Hero', subtitle: subtitle || undefined}
    },
  },
})

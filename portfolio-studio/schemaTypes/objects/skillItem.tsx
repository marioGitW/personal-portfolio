import {defineField, defineType} from 'sanity'
import {deviconUrl} from '../shared/devicon'
import {defineIconField} from '../shared/icon'

export default defineType({
  name: 'skillItem',
  title: 'Skill',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Technology name. Examples: "React", "TypeScript", "Java", "Spring Boot".',
    }),
    defineField({
      name: 'deviconPath',
      title: 'Devicon Path',
      type: 'string',
      description:
        'Path within the devicon icon set — e.g. "java/java-original.svg", "react/react-original.svg", "dotnetcore/dotnetcore-original.svg". Browse the full list at devicon.dev. Note the suffix varies per icon (-original, -plain, -line). The preview below updates as you type, so a wrong path shows up straight away.',
    }),
    defineIconField(
      'Optional override, for technologies devicon does not ship. When set, this file is used instead of the devicon path. Accepts SVG, PNG, JPG and JPEG.',
    ),
  ],
  preview: {
    select: {title: 'title', deviconPath: 'deviconPath', icon: 'icon'},
    prepare({title, deviconPath, icon}) {
      const url = deviconUrl(deviconPath)
      const hasUpload = Boolean(icon?.asset)
      return {
        title: title || 'Untitled skill',
        subtitle: hasUpload ? 'Custom upload' : deviconPath || 'No icon set',
        media: hasUpload ? icon : url ? <img src={url} alt="" /> : undefined,
      }
    },
  },
})

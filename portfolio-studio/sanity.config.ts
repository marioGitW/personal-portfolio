import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {SINGLETON_ACTIONS, SINGLETON_TYPES, structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'portfolio-cms',

  projectId: 'jgse9qxh',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
    // Removes singletons from the global "Create new document" menu, so a
    // second Portfolio document cannot be created by accident.
    templates: (templates) => templates.filter(({schemaType}) => !SINGLETON_TYPES.has(schemaType)),
  },

  document: {
    // Strips "Duplicate" and "Delete" from singleton documents.
    actions: (input, context) =>
      SINGLETON_TYPES.has(context.schemaType)
        ? input.filter(({action}) => action && SINGLETON_ACTIONS.has(action))
        : input,
  },
})

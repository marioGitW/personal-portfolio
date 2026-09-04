import type {StructureResolver} from 'sanity/structure'

/** The one and only Portfolio document lives at this fixed id. */
export const PORTFOLIO_DOCUMENT_ID = 'portfolio'

/** Document types that must never have more than one instance. */
export const SINGLETON_TYPES = new Set<string>(['portfolio'])

/**
 * Document actions a singleton is allowed to expose. Notably absent:
 * `duplicate` and `delete`, which would break the "exactly one" guarantee.
 */
export const SINGLETON_ACTIONS = new Set<string>(['publish', 'discardChanges', 'restore'])

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Portfolio')
        .id('portfolio')
        .child(
          S.document().schemaType('portfolio').documentId(PORTFOLIO_DOCUMENT_ID).title('Portfolio'),
        ),
      S.divider(),
      S.listItem()
        .title('Projects')
        .schemaType('project')
        .child(
          S.documentTypeList('project')
            .title('Projects')
            .defaultOrdering([{field: 'order', direction: 'asc'}]),
        ),
    ])

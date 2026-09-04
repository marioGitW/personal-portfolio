import {defineField} from 'sanity'

// A file field, not an image field: Sanity's image pipeline can't transform SVG
// and returns empty metadata for it, while a file stores the asset verbatim.
// Both MIME types and extensions are listed because browsers honour different ones.
export const ICON_ACCEPT = '.svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg'

export function defineIconField(description: string) {
  return defineField({
    name: 'icon',
    title: 'Icon',
    type: 'file',
    description,
    options: {accept: ICON_ACCEPT, storeOriginalFilename: true},
  })
}

import {defineField} from 'sanity'

/**
 * Icons must support SVG alongside the raster formats.
 *
 * Sanity's `image` type technically accepts an SVG upload, but the asset
 * pipeline cannot transform it: no crop/hotspot, no format conversion, and
 * `metadata` (dimensions, lqip, palette) comes back empty or unreliable.
 * A `file` field stores the asset verbatim and hands the frontend a plain
 * CDN URL, which is exactly what an <img src> / inline-SVG fetch needs.
 *
 * The `accept` option filters the OS file picker and the drop target, which
 * is the mechanism Sanity provides for MIME restriction on file fields.
 * Both the MIME types and the extensions are listed because browsers vary in
 * which one they honour (notably for `.svg` on Windows).
 */
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

import {defineField, defineType} from 'sanity'
import {defineIconField} from '../shared/icon'

/**
 * Platforms the frontend ships a built-in icon for. Keep in sync with
 * `SOCIAL_ICONS` in `../portfolio/src/components/ui/SocialIcons.tsx` — a value
 * added here without a matching entry there falls back to the generic icon.
 */
const PLATFORM_OPTIONS = [
  {title: 'GitHub', value: 'github'},
  {title: 'LinkedIn', value: 'linkedin'},
  {title: 'Instagram', value: 'instagram'},
  {title: 'WhatsApp', value: 'whatsapp'},
  {title: 'Email', value: 'email'},
  {title: 'Other', value: 'other'},
]

const PLATFORM_TITLES = new Map(PLATFORM_OPTIONS.map(({value, title}) => [value, title]))

export default defineType({
  name: 'socialLink',
  title: 'Social Link',
  type: 'object',
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      description:
        'Picks the icon. Choose "Other" and upload an icon below for anything not in this list.',
      options: {list: PLATFORM_OPTIONS},
    }),
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      description:
        'How the value below is turned into a link. Pick "WhatsApp" to open a chat from a phone number.',
      options: {
        list: [
          {title: 'Website / Profile URL', value: 'url'},
          {title: 'WhatsApp (phone number)', value: 'whatsapp'},
          {title: 'Email address', value: 'email'},
          {title: 'Phone (call)', value: 'phone'},
        ],
        layout: 'radio',
      },
      initialValue: 'url',
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description:
        'The destination. For a URL: "https://github.com/you". For WhatsApp or Phone: the number including country code, e.g. "+389 70 123 456" — spaces, dashes and the plus sign are fine, the site strips them. For Email: "you@example.com".',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description:
        'Optional. Used as the accessible name for screen readers and as the hover tooltip. Defaults to the platform name.',
    }),
    defineIconField(
      'Optional override. Needed only when Platform is "Other" — the listed platforms already have built-in icons that match the site theme. Accepts SVG, PNG, JPG and JPEG.',
    ),
  ],
  preview: {
    select: {label: 'label', platform: 'platform', value: 'value', icon: 'icon'},
    prepare({label, platform, value, icon}) {
      const platformTitle = platform ? PLATFORM_TITLES.get(platform) : undefined
      return {
        title: label || platformTitle || 'Untitled link',
        subtitle: value || undefined,
        media: icon,
      }
    },
  },
})

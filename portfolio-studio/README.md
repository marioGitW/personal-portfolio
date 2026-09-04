# portfolio-studio

The Sanity Studio that backs [`../portfolio`](../portfolio). Deployed separately from the
site — publishing here updates the live site within a minute, with no redeploy.

See [`../PRD.md`](../PRD.md) §3 for the content model.

## Run it

```bash
npm install
npm run dev      # http://localhost:3333
npm run deploy   # publish the studio
```

## Content model

- **`portfolio`** — a singleton holding `hero`, `about`, `experience`, `skills` and `social`.
  Duplicate and delete are stripped in `structure.ts` so a second one cannot be created.
- **`project`** — one document per project, ordered by `order`.

Icons are `file` fields rather than `image` fields: Sanity's image pipeline cannot transform
SVG and returns empty metadata for it, while a file stores the asset verbatim and hands the
frontend a plain CDN URL. Skill icons resolve as uploaded file first, else a devicon path.

## Notes

- **Do not run `npm audit fix` here.** The outstanding advisories are transitive through the
  Sanity CLI toolchain, are build-time only, and npm's proposed "fix" downgrades `sanity` a
  full major version. Pinning `js-yaml` via `overrides` also fails — `@vercel/frameworks`
  requires `^3.x`.
- Adding a social platform takes three edits: the `SocialPlatform` union in
  `../portfolio/src/types/sanity.ts`, the options in `schemaTypes/objects/socialLink.ts`, and
  the icon map in `../portfolio/src/components/ui/SocialIcons.tsx`.

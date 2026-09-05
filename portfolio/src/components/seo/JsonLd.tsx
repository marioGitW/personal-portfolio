type JsonLdProps = {
  data: Record<string, unknown>;
};

// Server component: the payload is serialised once at render and ships as
// static markup, so no JSON-LD library reaches the browser.
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify never emits a raw "</script>", but a CMS string that
      // contains one would close this tag early. Escaping "<" is what makes
      // the payload safe regardless of what an editor types.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}

import type { ContentItem } from '@adml/parser';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'source', 'track', 'wbr',
]);

export function isVoidElement(tag: string): boolean {
  return VOID_ELEMENTS.has(tag);
}

/**
 * Build an HTML attributes object from a ContentItem's mods and props.
 * Combines mods as CSS classes with any explicit props.class.
 * Flattens nested style objects into CSS strings.
 */
export function buildAttrs(item: ContentItem): Record<string, any> {
  const mods = item.mods ?? [];
  const props = item.props ?? {};
  const { class: propsClass, style: propsStyle, ...rest } = props;

  const classes = [...mods, propsClass].filter(Boolean).join(' ');
  const attrs: Record<string, any> = {};

  if (classes) attrs.class = classes;

  if (propsStyle && typeof propsStyle === 'object') {
    attrs.style = Object.entries(propsStyle)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
  } else if (propsStyle) {
    attrs.style = String(propsStyle);
  }

  for (const [key, val] of Object.entries(rest)) {
    if (typeof val === 'object') continue;
    attrs[key] = val;
  }

  return attrs;
}

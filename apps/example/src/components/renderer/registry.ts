import Citat from './Citat.astro';
import Text from './Text.astro';
import Html from './Html.astro';

/**
 * Component registry — maps content item types to Astro components.
 *
 * To add a new component:
 * 1. Create a .astro file in this directory
 * 2. Import it here and add it to the map
 *
 * Components receive: value, mods, props
 * Children are passed via <slot />.
 */
export const components: Record<string, any> = {
  citat: Citat,
  text: Text,
  html: Html,
};

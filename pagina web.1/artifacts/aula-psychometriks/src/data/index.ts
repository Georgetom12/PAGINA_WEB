export { contentN1 } from "./content-n1";
export { contentN2 } from "./content-n2";
export { contentN3 } from "./content-n3";
export { contentN4N5 } from "./content-n4n5";
export { contentN6N7 } from "./content-n6n7";
export { contentArmonicos } from "./content-armonicos";
export { contentMacroDashboard } from "./content-macro-dashboard";
export { contentChartsModules } from "./content-charts-modules";
export { contentGlosario } from "./content-glosario";
export { contentVisualCharts } from "./content-visual-charts";
export { contentAllVisuals } from "./content-all-visuals";
export { contentEnriched } from "./content-enriched";
export { contentN8 } from "./content-n8";
export { MODULES, LEVEL_META, type TradeModule, type Level } from "./modules";

import { contentN1 } from "./content-n1";
import { contentN2 } from "./content-n2";
import { contentN3 } from "./content-n3";
import { contentN4N5 } from "./content-n4n5";
import { contentN6N7 } from "./content-n6n7";
import { contentArmonicos } from "./content-armonicos";
import { contentMacroDashboard } from "./content-macro-dashboard";
import { contentChartsModules } from "./content-charts-modules";
import { contentGlosario } from "./content-glosario";
import { contentVisualCharts } from "./content-visual-charts";
import { contentAllVisuals } from "./content-all-visuals";
import { contentEnriched } from "./content-enriched";
import { contentN8 } from "./content-n8";

// Merge order matters: last spread wins for duplicate keys.
// contentChartsModules and contentVisualCharts go FIRST (base text).
// N1-N8 go LAST so their chart-rich versions always win over any plain-text duplicate.
export const ALL_CONTENT: Record<string, any> = {
  ...contentEnriched,
  ...contentAllVisuals,
  ...contentChartsModules,
  ...contentVisualCharts,
  ...contentArmonicos,
  ...contentMacroDashboard,
  ...contentGlosario,
  ...contentN1,
  ...contentN2,
  ...contentN3,
  ...contentN4N5,
  ...contentN6N7,
  ...contentN8,
};

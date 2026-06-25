import type { AulaModuleContent } from "../types";

export type { AulaModuleContent };
export { contentN1 } from "./content-n1";
export { contentN2 } from "./content-n2";
export { contentN3 } from "./content-n3";
export { contentN4N5 } from "./content-n4n5";
export { contentN6N7 } from "./content-n6n7";
export { MODULES, LEVEL_META, type TradeModule, type Level } from "./modules";

import { contentN1 } from "./content-n1";
import { contentN2 } from "./content-n2";
import { contentN3 } from "./content-n3";
import { contentN4N5 } from "./content-n4n5";
import { contentN6N7 } from "./content-n6n7";

export const ALL_CONTENT: Record<string, AulaModuleContent | undefined> = {
  ...contentN1,
  ...contentN2,
  ...contentN3,
  ...contentN4N5,
  ...contentN6N7,
};

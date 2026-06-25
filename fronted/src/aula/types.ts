export type InfoBoxVariant = "key" | "warn" | "tip" | "danger" | "pro";

export interface CardItem {
  color: string;
  title: string;
  icon: string;
  text: string;
}

export type Section =
  | { type: "text"; title?: string; body: string }
  | { type: "infobox"; title?: string; variant: InfoBoxVariant; label: string; text: string }
  | { type: "formula"; title?: string; text: string }
  | { type: "table"; title?: string; headers: string[]; rows: string[][] }
  | { type: "cards"; title?: string; cards: CardItem[] }
  | { type: string; title?: string; [key: string]: any };

export interface AulaModuleContent {
  sections: Section[];
}

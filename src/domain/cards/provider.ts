import type { Card } from "./types";

export interface CardProvider {
  list(): Promise<Card[]>;
  freeze(id: string, freeze: boolean): Promise<void>;
  setDefault(id: string): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  reveal?(id: string): Promise<Pick<Card, "panFull" | "exp" | "cvv">>;
}
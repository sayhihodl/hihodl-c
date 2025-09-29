import type { CardProvider } from "@/domain/cards/provider";
import type { Card } from "@/domain/cards/types";

let cards: Card[] = [
  { id:"1", label:"HiHODL • Daily",  last4:"8421", brand:"VISA", frozen:false, isDefault:true,  panMasked:"**** **** **** 8421" },
  { id:"2", label:"HiHODL • Social", last4:"0039", brand:"VISA", frozen:true,  isDefault:false, panMasked:"**** **** **** 0039" },
];

export const mockCardsProvider: CardProvider = {
  async list() { return cards; },
  async freeze(id, f) { cards = cards.map(c => c.id === id ? { ...c, frozen: f } : c); },
  async setDefault(id) { cards = cards.map(c => ({ ...c, isDefault: c.id === id })); },
  async rename(id, name) { cards = cards.map(c => c.id === id ? ({ ...c, label: name }) : c); },
  async reveal(id) {
    // solo demo
    return { panFull: "4242 4242 4242 4242", exp: "12/28", cvv: "123" };
  },
};
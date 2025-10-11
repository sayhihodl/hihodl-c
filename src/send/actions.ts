// src/send/actions.ts
import type { RecipientKind } from "@/types/send";

export type ActionId =
  | "send_again" | "change_nickname" | "choose_network"
  | "view_details" | "copy_address" | "copy_iban" | "share_invite"
  | "favorite" | "pin" | "remove_recent";

export function actionsFor(item: { kind: RecipientKind }): ActionId[] {
  const base: ActionId[] = [
    "send_again", "change_nickname", "view_details", "favorite", "pin", "remove_recent"
  ];

  if (
    item.kind === "evm" ||
    item.kind === "sol" ||
    item.kind === "tron" ||
    item.kind === "ens"
  ) {
    base.splice(1, 0, "choose_network", "copy_address");
  }
  if (item.kind === "iban") {
    base.splice(1, 0, "copy_iban");
  }
  if (item.kind === "phone" || item.kind === "email") {
    base.splice(1, 0, "share_invite");
  }

  return base;
}
export type Card = {
  id: string;
  label: string;
  last4: string;
  brand: "VISA" | "MASTERCARD";
  frozen: boolean;
  isDefault: boolean;
  panMasked?: string;
  panFull?: string;
  exp?: string;
  cvv?: string;
  designId?: string; // StableCards skin
};
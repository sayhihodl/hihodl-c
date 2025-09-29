// src/mocks/payments.mock.ts
export type PaymentKind = "in" | "out" | "refund";
export type PaymentItem = {
  id: string;
  title: string;
  when: string;
  amount: string; // ej: "+ USDT 19.00"
  type: PaymentKind;
};

export type Account = "Daily" | "Savings" | "Social";

export const PAYMENTS_MOCK: Record<Account, PaymentItem[]> = {
  Daily: [
    { id: "a1", title: "@satoshi",    when: "Yesterday, 22:27", amount: "+ USDT 19.00", type: "in" },
    { id: "a2", title: "Apple inc.",  when: "27 May, 09:05",    amount: "- USDC 124.24", type: "out" },
    { id: "a3", title: "@helloalex",  when: "Yesterday, 21:17", amount: "- USDT 15.00", type: "out" },
    { id: "a4", title: "@gerard",     when: "Yesterday, 20:02", amount: "- USDT 49.00", type: "refund" },
    { id: "a5", title: "@maria",      when: "Today, 11:14",     amount: "+ USDC 35.80", type: "in" },
    { id: "a6", title: "Netflix",     when: "Today, 08:40",     amount: "- USDC 12.99", type: "out" },
  ],
  Savings: [
    { id: "s1", title: "@satoshi",    when: "Yesterday, 22:27", amount: "+ USDT 19.00", type: "in" },
    { id: "s2", title: "Apple inc.",  when: "27 May, 09:05",    amount: "- USDC 124.24", type: "out" },
    { id: "s3", title: "@helloalex",  when: "Yesterday, 21:17", amount: "- USDT 15.00", type: "out" },
    { id: "s4", title: "@gerard",     when: "Yesterday, 20:02", amount: "- USDT 49.00", type: "refund" },
  ],
  Social: [
    { id: "p1", title: "@friend1",    when: "Yesterday, 18:22", amount: "+ USDT 7.00",  type: "in" },
    { id: "p2", title: "@friend2",    when: "Yesterday, 16:03", amount: "- USDT 4.20",  type: "out" },
  ],
};
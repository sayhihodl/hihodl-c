// src/utils/money.ts
export const maskValue = (len: number = 4) => "•".repeat(len);

export const displayAmount = (
  value: string | number,
  visible: boolean,
  maskLen = 6
) => {
  return visible ? String(value) : maskValue(maskLen);
};
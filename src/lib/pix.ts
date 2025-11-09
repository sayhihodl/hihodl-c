// src/lib/pix.ts
// Parser para códigos QR PIX (Brasil) - formato EMV

export type PIXData = {
  // Información del beneficiario
  merchantName?: string;
  merchantCity?: string;
  merchantAccountInfo?: string;
  
  // Información de la transacción
  amount?: string; // en BRL
  currency?: string; // código ISO 4217 (986 = BRL)
  
  // Código PIX (identificador único)
  pixKey?: string;
  
  // Información adicional
  description?: string;
  transactionId?: string;
  
  // Raw payload para referencia
  rawPayload: string;
};

/**
 * Parsea un código QR PIX en formato EMV
 * Los códigos PIX siguen el estándar EMV con campos específicos
 */
export function parsePIXQR(raw: string): PIXData | null {
  try {
    const trimmed = raw.trim();
    
    // Los códigos PIX suelen empezar con "000201" (Payload Format Indicator = "01")
    // y contienen "010211" en el Merchant Account Information (ID 26) que indica PIX
    if (!trimmed.startsWith("000201")) {
      return null;
    }
    
    // Verificar que contiene el identificador de PIX en el Merchant Account Information
    // Buscar el campo 26 que contiene información de la cuenta del merchant
    if (!trimmed.includes("010211")) {
      // El "0102" es el GUID (Globally Unique Identifier) de PIX
      // Pero algunos códigos pueden tener variaciones, intentamos parsear de todos modos
      // si tiene la estructura EMV correcta
    }
    
    const data: PIXData = {
      rawPayload: trimmed,
    };
    
    // Parsear campos EMV
    let pos = 0;
    while (pos < trimmed.length) {
      // Cada campo EMV tiene formato: LLTTVVVVV
      // LL = longitud del campo (2 dígitos)
      // TT = ID del campo (2 dígitos)
      // VVVVV = valor del campo
      
      if (pos + 2 > trimmed.length) break;
      const length = parseInt(trimmed.slice(pos, pos + 2), 10);
      if (isNaN(length) || length <= 0) break;
      
      if (pos + 4 > trimmed.length) break;
      const fieldId = trimmed.slice(pos + 2, pos + 4);
      
      if (pos + 4 + length > trimmed.length) break;
      const value = trimmed.slice(pos + 4, pos + 4 + length);
      
      // Parsear según el ID del campo
      switch (fieldId) {
        case "00": // Payload Format Indicator (debe ser "01")
          break;
        case "26": // Merchant Account Information (contiene info de PIX)
          parseMerchantAccountInfo(value, data);
          break;
        case "52": // Merchant Category Code
          break;
        case "53": // Transaction Currency (ej: "986" = BRL)
          data.currency = value;
          break;
        case "54": // Transaction Amount
          data.amount = value;
          break;
        case "58": // Country Code (ej: "BR" = Brasil)
          break;
        case "59": // Merchant Name
          data.merchantName = value;
          break;
        case "60": // Merchant City
          data.merchantCity = value;
          break;
        case "62": // Additional Data Field Template
          parseAdditionalData(value, data);
          break;
      }
      
      pos += 4 + length;
    }
    
    // Validar que tenemos al menos información mínima de PIX
    if (!data.merchantAccountInfo && !data.pixKey) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * Parsea el Merchant Account Information (campo 26) que contiene info específica de PIX
 */
function parseMerchantAccountInfo(value: string, data: PIXData): void {
  let pos = 0;
  while (pos < value.length) {
    if (pos + 2 > value.length) break;
    const length = parseInt(value.slice(pos, pos + 2), 10);
    if (isNaN(length) || length <= 0) break;
    
    if (pos + 4 > value.length) break;
    const subFieldId = value.slice(pos + 2, pos + 4);
    
    if (pos + 4 + length > value.length) break;
    const subValue = value.slice(pos + 4, pos + 4 + length);
    
    switch (subFieldId) {
      case "01": // GUID (Global Unique Identifier) - "02" indica PIX
        // "02" = PIX
        break;
      case "25": // Chave PIX (PIX Key) - puede ser CPF, email, telefone, chave aleatória, etc.
        data.pixKey = subValue;
        break;
      case "26": // Información adicional
        data.description = subValue;
        break;
    }
    
    pos += 4 + length;
  }
  
  // Si no encontramos un campo específico, usar todo el valor como merchantAccountInfo
  if (!data.pixKey) {
    data.merchantAccountInfo = value;
  }
}

/**
 * Parsea Additional Data Field Template (campo 62)
 */
function parseAdditionalData(value: string, data: PIXData): void {
  let pos = 0;
  while (pos < value.length) {
    if (pos + 2 > value.length) break;
    const length = parseInt(value.slice(pos, pos + 2), 10);
    if (isNaN(length) || length <= 0) break;
    
    if (pos + 4 > value.length) break;
    const subFieldId = value.slice(pos + 2, pos + 4);
    
    if (pos + 4 + length > value.length) break;
    const subValue = value.slice(pos + 4, pos + 4 + length);
    
    switch (subFieldId) {
      case "05": // Reference Label (ID de transacción)
        data.transactionId = subValue;
        break;
      case "08": // Description
        if (!data.description) {
          data.description = subValue;
        }
        break;
    }
    
    pos += 4 + length;
  }
}

/**
 * Valida que los datos PIX sean válidos
 */
export function validatePIXData(data: PIXData): { ok: true } | { ok: false; reason: string } {
  if (!data || !data.rawPayload) {
    return { ok: false, reason: "Invalid PIX QR code" };
  }
  
  if (!data.pixKey && !data.merchantAccountInfo) {
    return { ok: false, reason: "Missing PIX key or merchant account info" };
  }
  
  if (data.amount) {
    const amountNum = parseFloat(data.amount);
    if (isNaN(amountNum) || amountNum < 0) {
      return { ok: false, reason: "Invalid amount" };
    }
  }
  
  return { ok: true };
}

/**
 * Detecta si un string es un código QR PIX
 */
export function isPIXQR(raw: string): boolean {
  const trimmed = raw.trim();
  // Los códigos PIX empiezan con "000201" (Payload Format Indicator = "01")
  // y contienen información de PIX en el campo 26
  return trimmed.startsWith("000201") && trimmed.includes("010211");
}


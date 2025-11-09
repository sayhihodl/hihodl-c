// src/lib/mercadoPago.ts
// Parser para códigos QR Mercado Pago - formato EMV

export type MercadoPagoData = {
  // Información del beneficiario
  merchantName?: string;
  merchantCity?: string;
  
  // Información de la transacción
  amount?: string; // monto en la moneda especificada
  currency?: string; // código ISO 4217
  
  // ID de Mercado Pago
  mercadoPagoId?: string; // ID del punto de venta o usuario
  
  // Información adicional
  description?: string;
  reference?: string; // referencia externa
  
  // Raw payload para referencia
  rawPayload: string;
};

/**
 * Parsea un código QR de Mercado Pago en formato EMV
 * Mercado Pago usa el estándar EMV con su propio identificador
 */
export function parseMercadoPagoQR(raw: string): MercadoPagoData | null {
  try {
    const trimmed = raw.trim();
    
    // Los códigos Mercado Pago pueden empezar con "000201" (formato EMV estándar)
    // o pueden ser URLs de Mercado Pago
    if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
      return parseMercadoPagoURL(trimmed);
    }
    
    // Verificar formato EMV
    if (!trimmed.startsWith("000201")) {
      return null;
    }
    
    const data: MercadoPagoData = {
      rawPayload: trimmed,
    };
    
    // Parsear campos EMV
    let pos = 0;
    while (pos < trimmed.length) {
      if (pos + 2 > trimmed.length) break;
      const length = parseInt(trimmed.slice(pos, pos + 2), 10);
      if (isNaN(length) || length <= 0) break;
      
      if (pos + 4 > trimmed.length) break;
      const fieldId = trimmed.slice(pos + 2, pos + 4);
      
      if (pos + 4 + length > trimmed.length) break;
      const value = trimmed.slice(pos + 4, pos + 4 + length);
      
      switch (fieldId) {
        case "00": // Payload Format Indicator
          break;
        case "26": // Merchant Account Information (contiene info de Mercado Pago)
          parseMercadoPagoAccountInfo(value, data);
          break;
        case "52": // Merchant Category Code
          break;
        case "53": // Transaction Currency
          data.currency = value;
          break;
        case "54": // Transaction Amount
          data.amount = value;
          break;
        case "58": // Country Code
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
    
    // Validar que tenemos información de Mercado Pago
    // Buscar en el Merchant Account Information o en URLs
    if (!data.mercadoPagoId && !data.rawPayload.includes("mercadopago") && !data.rawPayload.includes("mp")) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * Parsea URLs de Mercado Pago (formato alternativo)
 */
function parseMercadoPagoURL(url: string): MercadoPagoData | null {
  try {
    const urlObj = new URL(url);
    
    // Verificar que es de Mercado Pago
    const hostname = urlObj.hostname.toLowerCase();
    if (!hostname.includes("mercadopago") && !hostname.includes("mercadolibre")) {
      return null;
    }
    
    const data: MercadoPagoData = {
      rawPayload: url,
    };
    
    // Intentar extraer información de query params o path
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    const mercadoPagoId = pathParts.find(p => /^\d+$/.test(p));
    if (mercadoPagoId) {
      data.mercadoPagoId = mercadoPagoId;
    }
    
    // Buscar amount en query params
    const amount = urlObj.searchParams.get("amount") || urlObj.searchParams.get("monto");
    if (amount) {
      data.amount = amount;
    }
    
    // Buscar currency
    const currency = urlObj.searchParams.get("currency") || urlObj.searchParams.get("moneda");
    if (currency) {
      data.currency = currency;
    }
    
    // Buscar description
    const description = urlObj.searchParams.get("description") || urlObj.searchParams.get("descripcion");
    if (description) {
      data.description = decodeURIComponent(description);
    }
    
    // Buscar reference
    const reference = urlObj.searchParams.get("reference") || urlObj.searchParams.get("referencia");
    if (reference) {
      data.reference = reference;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * Parsea el Merchant Account Information (campo 26) para Mercado Pago
 */
function parseMercadoPagoAccountInfo(value: string, data: MercadoPagoData): void {
  let pos = 0;
  while (pos < value.length) {
    if (pos + 2 > value.length) break;
    const length = parseInt(value.slice(pos, pos + 2), 10);
    if (isNaN(length) || length <= 0) break;
    
    if (pos + 4 > value.length) break;
    const subFieldId = value.slice(pos + 2, pos + 4);
    
    if (pos + 4 + length > value.length) break;
    const subValue = value.slice(pos + 4, pos + 4 + length);
    
    // Mercado Pago usa su propio esquema en el Merchant Account Information
    // El subFieldId puede ser "00" para el identificador del PSP (Payment Service Provider)
    // y otros campos para información específica
    switch (subFieldId) {
      case "00": // PSP Identifier (Mercado Pago tiene su código)
        // Si contiene "mp" o números que parecen ID de Mercado Pago
        if (/^\d+$/.test(subValue)) {
          data.mercadoPagoId = subValue;
        }
        break;
      case "01": // Merchant Identifier
        if (!data.mercadoPagoId && /^\d+$/.test(subValue)) {
          data.mercadoPagoId = subValue;
        }
        break;
      case "02": // Terminal Label
        break;
      case "03": // Additional Data
        if (!data.description) {
          data.description = subValue;
        }
        break;
    }
    
    pos += 4 + length;
  }
}

/**
 * Parsea Additional Data Field Template (campo 62)
 */
function parseAdditionalData(value: string, data: MercadoPagoData): void {
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
      case "05": // Reference Label
        data.reference = subValue;
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
 * Valida que los datos de Mercado Pago sean válidos
 */
export function validateMercadoPagoData(data: MercadoPagoData): { ok: true } | { ok: false; reason: string } {
  if (!data || !data.rawPayload) {
    return { ok: false, reason: "Invalid Mercado Pago QR code" };
  }
  
  if (!data.mercadoPagoId && !data.rawPayload.includes("mercadopago") && !data.rawPayload.includes("mp")) {
    return { ok: false, reason: "Missing Mercado Pago identifier" };
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
 * Detecta si un string es un código QR de Mercado Pago
 */
export function isMercadoPagoQR(raw: string): boolean {
  const trimmed = raw.trim().toLowerCase();
  
  // URLs de Mercado Pago
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.includes("mercadopago") || 
           trimmed.includes("mercadolibre") ||
           trimmed.includes("mp.co") ||
           trimmed.includes("mpago");
  }
  
  // Códigos EMV que contienen información de Mercado Pago
  if (trimmed.startsWith("000201")) {
    // Buscar indicadores de Mercado Pago en el payload
    return trimmed.includes("mercadopago") || 
           trimmed.includes("mercado") ||
           // Mercado Pago puede tener identificadores específicos en el campo 26
           /26\d{2}\d{2}00\d{2}(mp|mercadopago)/i.test(trimmed);
  }
  
  return false;
}


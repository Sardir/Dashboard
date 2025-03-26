// Map site IDs to exact database table names
export const siteToTableName: Record<string, string> = {
  f21: "Al_Faqaa",
  Al_Faqaa: "Al_Faqaa",
  Faqah: "Al_Faqaa",

  f24: "Kasna",
  Kasna: "Kasna",
  Khaznah: "Kasna",

  f22: "Forest1",
  Forest1: "Forest1",

  f08: "BK1",
  BK1: "BK1",

  f09: "Liwa2",
  Liwa2: "Liwa2",

  f10: "Harz1",
  Harz1: "Harz1",

  f11: "Harz2F11",
  Harz2: "Harz2F11",

  f12: "Al_Hayeer",
  Al_Hayeer: "Al_Hayeer",
  AlHayeer: "Al_Hayeer",

  f14: "Omar1F14",
  Omar1: "Omar1F14",

  f15: "Omar2",
  Omar2: "Omar2",

  f16: "Harz3F16",
  Harz3: "Harz3F16",

  f17: "BK2",
  BK2: "BK2",

  f18: "BK3",
  BK3: "BK3",

  f19: "Wagan",
  Wagan1: "Wagan",

  f20: "Mafraq",
  Mafraq: "Mafraq",

  f23: "Forest2",
  Forest2: "Forest2",

  f27: "Al_Arad",
  Arad1: "Al_Arad",
  Al_Arad: "Al_Arad",

  f29: "ZAKIR",
  Zakir: "ZAKIR",
  ZAKIR: "ZAKIR",

  f30: "BK4",
  BK4: "BK4",
}

// Get the correct table name from the site ID or timestamp
export function getTableName(siteId: string): string {
  return siteToTableName[siteId] || siteId
}


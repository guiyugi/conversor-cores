// Color conversion utility functions.
// Canonical internal representation: RGB (0-255 integers)

export interface RGB {
  r: number
  g: number
  b: number
}
export interface CMYK {
  c: number
  m: number
  y: number
  k: number
} // 0-100
export interface HSL {
  h: number
  s: number
  l: number
} // h 0-360, s/l 0-100
export interface HSV {
  h: number
  s: number
  v: number
} // h 0-360, s/v 0-100

// Clamp helper
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.trim().replace(/^#/, "")
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const r = parseInt(cleaned[0] + cleaned[0], 16)
    const g = parseInt(cleaned[1] + cleaned[1], 16)
    const b = parseInt(cleaned[2] + cleaned[2], 16)
    return { r, g, b }
  }
  if (!/^([0-9a-fA-F]{6})$/.test(cleaned)) return null
  const r = Number.parseInt(cleaned.slice(0, 2), 16)
  const g = Number.parseInt(cleaned.slice(2, 4), 16)
  const b = Number.parseInt(cleaned.slice(4, 6), 16)
  return { r, g, b }
}

// CMYK <-> RGB
export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 }
  const r1 = r / 255,
    g1 = g / 255,
    b1 = b / 255
  const k = 1 - Math.max(r1, g1, b1)
  const c = (1 - r1 - k) / (1 - k)
  const m = (1 - g1 - k) / (1 - k)
  const y = (1 - b1 - k) / (1 - k)
  return { c: +(c * 100).toFixed(1), m: +(m * 100).toFixed(1), y: +(y * 100).toFixed(1), k: +(k * 100).toFixed(1) }
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const c1 = c / 100,
    m1 = m / 100,
    y1 = y / 100,
    k1 = k / 100
  const r = 255 * (1 - c1) * (1 - k1)
  const g = 255 * (1 - m1) * (1 - k1)
  const b = 255 * (1 - y1) * (1 - k1)
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) }
}

// HSL <-> RGB
export function rgbToHsl({ r, g, b }: RGB): HSL {
  const r1 = r / 255,
    g1 = g / 255,
    b1 = b / 255
  const max = Math.max(r1, g1, b1),
    min = Math.min(r1, g1, b1)
  let h = 0,
    s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r1:
        h = (g1 - b1) / d + (g1 < b1 ? 6 : 0)
        break
      case g1:
        h = (b1 - r1) / d + 2
        break
      default:
        h = (r1 - g1) / d + 4
        break
    }
    h *= 60
  }
  return { h: +h.toFixed(1), s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const h1 = ((h % 360) + 360) % 360 // normalize
  const s1 = s / 100,
    l1 = l / 100
  if (s1 === 0) {
    const v = Math.round(l1 * 255)
    return { r: v, g: v, b: v }
  }
  const c = (1 - Math.abs(2 * l1 - 1)) * s1
  const x = c * (1 - Math.abs(((h1 / 60) % 2) - 1))
  const m = l1 - c / 2
  let r1 = 0,
    g1 = 0,
    b1 = 0
  if (h1 < 60) {
    r1 = c
    g1 = x
  } else if (h1 < 120) {
    r1 = x
    g1 = c
  } else if (h1 < 180) {
    g1 = c
    b1 = x
  } else if (h1 < 240) {
    g1 = x
    b1 = c
  } else if (h1 < 300) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }
  return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) }
}

// HSV <-> RGB
export function rgbToHsv({ r, g, b }: RGB): HSV {
  const r1 = r / 255,
    g1 = g / 255,
    b1 = b / 255
  const max = Math.max(r1, g1, b1),
    min = Math.min(r1, g1, b1)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r1:
        h = (g1 - b1) / d + (g1 < b1 ? 6 : 0)
        break
      case g1:
        h = (b1 - r1) / d + 2
        break
      default:
        h = (r1 - g1) / d + 4
        break
    }
    h *= 60
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h: +h.toFixed(1), s: +(s * 100).toFixed(1), v: +(v * 100).toFixed(1) }
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const h1 = ((h % 360) + 360) % 360
  const s1 = s / 100,
    v1 = v / 100
  const c = v1 * s1
  const x = c * (1 - Math.abs(((h1 / 60) % 2) - 1))
  const m = v1 - c
  let r1 = 0,
    g1 = 0,
    b1 = 0
  if (h1 < 60) {
    r1 = c
    g1 = x
  } else if (h1 < 120) {
    r1 = x
    g1 = c
  } else if (h1 < 180) {
    g1 = c
    b1 = x
  } else if (h1 < 240) {
    g1 = x
    b1 = c
  } else if (h1 < 300) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }
  return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) }
}

// Dispatcher para converter qualquer modelo suportado em RGB
export type ColorModel = "RGB" | "CMYK" | "HSL" | "HSV" | "HEX"

type AnyColorValue = RGB | CMYK | HSL | HSV | string

export function toRgb(model: ColorModel, value: AnyColorValue): RGB | null {
  try {
    switch (model) {
      case "RGB": {
        const v = value as RGB
        return { r: clamp(v.r, 0, 255), g: clamp(v.g, 0, 255), b: clamp(v.b, 0, 255) }
      }
      case "CMYK": {
        const v = value as CMYK
        return cmykToRgb({ c: clamp(v.c, 0, 100), m: clamp(v.m, 0, 100), y: clamp(v.y, 0, 100), k: clamp(v.k, 0, 100) })
      }
      case "HSL": {
        const v = value as HSL
        return hslToRgb({ h: clamp(v.h, 0, 360), s: clamp(v.s, 0, 100), l: clamp(v.l, 0, 100) })
      }
      case "HSV": {
        const v = value as HSV
        return hsvToRgb({ h: clamp(v.h, 0, 360), s: clamp(v.s, 0, 100), v: clamp(v.v, 0, 100) })
      }
      case "HEX":
        return typeof value === "string" ? hexToRgb(value) : null
      default:
        return null
    }
  } catch {
    return null
  }
}

export function fromRgb(rgb: RGB) {
  return { rgb, cmyk: rgbToCmyk(rgb), hsl: rgbToHsl(rgb), hsv: rgbToHsv(rgb), hex: rgbToHex(rgb) }
}

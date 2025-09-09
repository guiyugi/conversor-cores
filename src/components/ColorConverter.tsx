"use client"
import { useState, useCallback, useEffect } from "react"
import type React from "react"

import { type RGB, type CMYK, type HSL, type HSV, toRgb, fromRgb, rgbToHsv, hsvToRgb } from "../lib/color"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Copy, Palette, RefreshCw, X, GripVertical, Layers, Trash, FileDown } from "lucide-react"

type State = {
  rgb: RGB
  cmyk: CMYK
  hsl: HSL
  hsv: HSV
  hex: string
}

const INITIAL: State = fromRgb({ r: 59, g: 30, b: 84 }) as unknown as State // Start with primary palette color

interface SavedColor { hex: string; rgb: RGB; timestamp: number; generated?: boolean }
const MAX_HISTORY = 8

interface NumberInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  suffix?: string
}

const NumberInput = ({ label, value, min, max, step = 1, onChange, suffix }: NumberInputProps) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground">
      <span>{label}{suffix && <span className="opacity-70 ml-1">{suffix}</span>}</span>
      <span className="tabular-nums text-[11px] text-foreground/70">{value}</span>
    </div>
    <input
      type="range"
      className="w-full accent-primary cursor-pointer"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
    />
    <input
      type="number"
      className="w-full px-2 py-1 bg-input border border-border rounded-md text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary transition-all"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
    />
  </div>
)

// Custom inline color picker (Hue slider + Saturation/Value square)
interface PickerProps { rgb: RGB; onChange: (rgb: RGB) => void }
const CustomColorPicker = ({ rgb, onChange }: PickerProps) => {
  const hsv = rgbToHsv(rgb)
  const handleHue = (h: number) => {
    const updated = hsvToRgb({ h, s: hsv.s, v: hsv.v })
    onChange(updated)
  }
  const handleSV = (s: number, v: number) => {
    const updated = hsvToRgb({ h: hsv.h, s, v })
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div
        className="relative w-full aspect-[4/3] rounded-md overflow-hidden cursor-crosshair border border-border"
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const update = (clientX: number, clientY: number) => {
            const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
            const y = Math.min(Math.max(clientY - rect.top, 0), rect.height)
            const s = +(x / rect.width * 100).toFixed(1)
            const v = +((1 - y / rect.height) * 100).toFixed(1)
            handleSV(s, v)
          }
          update(e.clientX, e.clientY)
          const move = (ev: MouseEvent) => update(ev.clientX, ev.clientY)
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
        style={{
          background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, hsl(${hsv.h},100%,50%))`
        }}
        aria-label="Seletor de Saturação e Valor"
        role="application"
      >
        <div
          className="absolute w-3 h-3 rounded-full border border-white/70 shadow -ml-1.5 -mt-1.5"
          style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: `rgb(${rgb.r},${rgb.g},${rgb.b})` }}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground flex justify-between">
          <span>Matiz (Hue)</span><span className="tabular-nums text-foreground/70">{hsv.h}</span>
        </label>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
            value={hsv.h}
          aria-label="Hue"
          onChange={(e) => handleHue(Number(e.target.value))}
          className="w-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${Array.from({length: 7}).map((_,i)=>`hsl(${i*60},100%,50%)`).join(',')})`
          }}
        />
      </div>
    </div>
  )
}

export default function ColorConverter() {
  const [state, setState] = useState<State>(INITIAL)
  const [history, setHistory] = useState<SavedColor[]>([])
  const [pinned, setPinned] = useState<SavedColor[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Load from localStorage
  useEffect(() => {
    try {
      const h = localStorage.getItem('color-history');
      const p = localStorage.getItem('color-pinned');
      if (h) {
        try {
          const parsed: SavedColor[] = JSON.parse(h)
          setHistory(parsed.slice(0, MAX_HISTORY))
        } catch {}
      }
      if (p) setPinned(JSON.parse(p));
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem('color-history', JSON.stringify(history)); } catch {} }, [history])
  useEffect(() => { try { localStorage.setItem('color-pinned', JSON.stringify(pinned)); } catch {} }, [pinned])

  const updateFrom = useCallback(
    (model: "RGB" | "CMYK" | "HSL" | "HSV" | "HEX", value: RGB | CMYK | HSL | HSV | string, opts?: {skipHistory?: boolean}) => {
      const rgb = toRgb(model, value)
      if (!rgb) return
      const next = fromRgb(rgb) as unknown as State
      if (next.hex !== state.hex) {
        setPinned(prev => prev.filter(p => !p.generated))
      }
      setState(next)
      if (!opts?.skipHistory) {
        const hex = next.hex
        setHistory(prev => {
          if (prev[0]?.hex === hex) return prev
          const updated = [{ hex, rgb, timestamp: Date.now() }, ...prev.filter(c => c.hex !== hex)]
          return updated.slice(0, MAX_HISTORY)
        })
      }
    },
    [state.hex],
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const resetToDefault = () => {
    setState(INITIAL)
  }

  const pinCurrent = () => {
    setPinned(prev => {
      if (prev.find(p => p.hex === state.hex)) return prev
      return [...prev, { hex: state.hex, rgb: state.rgb, timestamp: Date.now() }]
    })
  }

  const removePinned = (hex: string) => setPinned(prev => prev.filter(p => p.hex !== hex))
  const clearHistory = () => setHistory([])
  const exportCurrentColor = () => {
    const data = {
      hex: state.hex,
      rgb: state.rgb,
      cmyk: state.cmyk,
      hsl: state.hsl,
      hsv: state.hsv
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `color-${state.hex.replace('#','')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDragStart = (idx: number) => setDragIndex(idx)
  const handleDragEnter = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) return
    setPinned(prev => {
      const cp = [...prev]
      const [item] = cp.splice(dragIndex, 1)
      cp.splice(idx, 0, item)
      return cp
    })
    setDragIndex(idx)
  }
  const handleDragEnd = () => setDragIndex(null)

  const generateVariations = () => {
    const base = state.rgb
    const blend = (target: number[], factor: number): RGB => ({
      r: Math.round(base.r + (target[0] - base.r) * factor),
      g: Math.round(base.g + (target[1] - base.g) * factor),
      b: Math.round(base.b + (target[2] - base.b) * factor),
    })
    const white: [number, number, number] = [255, 255, 255]
    const black: [number, number, number] = [0, 0, 0]
    const steps = [0.15, 0.30, 0.45]
    const vars: SavedColor[] = []
    steps.forEach(f => vars.push({ hex: fromRgb(blend(white, f)).hex, rgb: blend(white, f), timestamp: Date.now() + f, generated: true }))
    steps.forEach(f => vars.push({ hex: fromRgb(blend(black, f)).hex, rgb: blend(black, f), timestamp: Date.now() + 100 + f, generated: true }))
    // merge unique
    setPinned(prev => {
      const map = new Map<string, SavedColor>()
      ;[...prev, ...vars].forEach(c => { if (!map.has(c.hex)) map.set(c.hex, c) })
      return Array.from(map.values())
    })
  }

  const toggleVariations = () => {
    const has = pinned.some(p => p.generated)
    if (has) {
      // fechar: remover apenas as variações geradas
      setPinned(prev => prev.filter(p => !p.generated))
    } else {
      generateVariations()
    }
  }

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFrom("HEX", e.target.value)
  }

  const { rgb, cmyk, hsl, hsv, hex } = state
  const variationsOpen = pinned.some(p => p.generated)
  const [hexDraft, setHexDraft] = useState<string>(hex)
  useEffect(()=>{ setHexDraft(hex) }, [hex])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 p-4">
      {/* HEADER */}
      <div className="text-center space-y-5">
        <div className="mx-auto w-fit p-4 rounded-2xl bg-gradient-to-tr from-primary/20 via-accent/20 to-primary/10 border border-primary/30 shadow-sm">
          <Palette className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-[0_3px_12px_rgba(155,126,189,0.55)]">
          Conversor de Cores
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Insira valores em qualquer modelo ou use o seletor para ver conversões imediatas entre HEX, RGB, CMYK, HSL e HSV.
        </p>
        <div className="flex justify-center flex-wrap gap-3">
          <Button onClick={resetToDefault} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Resetar
          </Button>
          <Button variant="outline" onClick={pinCurrent} className="gap-2" title="Fixar cor atual">
            <span>Fixar</span>
          </Button>
          <Button variant="outline" onClick={toggleVariations} className="gap-2" title={variationsOpen ? 'Fechar variações' : 'Gerar variações (tints & shades)'}>
            <Layers className="w-4 h-4" />
            <span>{variationsOpen ? 'Fechar Variações' : 'Variações'}</span>
          </Button>
          {/* Botões de copiar paleta e exportar JSON removidos conforme solicitado */}
          <Button variant="outline" onClick={clearHistory} className="gap-2" title="Limpar histórico">
            <X className="w-4 h-4" />
            <span>Limpar Hist.</span>
          </Button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* LEFT: Preview + Values + Picker */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/30">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/10 via-accent/10 to-transparent">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 rounded-full border border-border shadow-inner" style={{ backgroundColor: hex }} />
                Pré-visualização
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <CustomColorPicker rgb={rgb} onChange={(c)=> updateFrom('RGB', c)} />
              {/* Pinned Palette */}
              {pinned.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">Variações <span className="text-[10px] font-normal opacity-60">(arraste para reordenar)</span></h3>
                  <div className="flex flex-wrap gap-2">
                    {pinned.map((pc, idx) => (
                      <div
                        key={pc.hex}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragEnter={(e)=>{ e.preventDefault(); handleDragEnter(idx) }}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e)=> e.preventDefault()}
                        className="group relative w-12 h-12 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring overflow-hidden cursor-move"
                        style={{ backgroundColor: pc.hex, outline: dragIndex===idx? '2px solid var(--ring)':undefined }}
                        title={pc.hex}
                      >
                        <button
                          onClick={() => removePinned(pc.hex)}
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-black/50 text-white w-5 h-5 flex items-center justify-center text-[10px]"
                          aria-label="Remover cor fixada"
                        ><X size={12} /></button>
                        <button
                          onClick={() => updateFrom('HEX', pc.hex)}
                          className="absolute inset-0 opacity-0 group-active:opacity-100 group-hover:opacity-90 text-[9px] font-mono text-white flex items-center justify-center bg-black/30"
                        >{pc.hex.substring(1)}</button>
                        <div className="absolute left-0 top-0 p-0.5 opacity-0 group-hover:opacity-100 text-white"><GripVertical size={14} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Recent History */}
              {history.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center justify-between">
                    <span>Histórico</span>
                    <button
                      onClick={clearHistory}
                      className="ml-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      title="Limpar histórico"
                      aria-label="Limpar histórico"
                    >
                      <Trash size={12} />
                    </button>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {history.map(hc => (
                      <button
                        key={hc.timestamp + hc.hex}
                        onClick={() => updateFrom('HEX', hc.hex, { skipHistory: true })}
                        className="group relative w-8 h-8 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring overflow-hidden"
                        style={{ backgroundColor: hc.hex }}
                        title={hc.hex}
                      >
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 text-[9px] text-white flex items-center justify-center transition-opacity">{hc.hex.substring(1)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-primary">Valores Consolidados</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[
                { label: "HEX", value: hex },
                { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
                { label: "CMYK", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
                { label: "HSL", value: `hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)` },
                { label: "HSV", value: `hsv(${hsv.h}°, ${hsv.s}%, ${hsv.v}%)` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted/60 hover:bg-muted transition-colors group"
                >
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground tracking-wider">{label}</span>
                    <div className="font-mono text-sm truncate">{value}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(value)}
                    className="opacity-60 group-hover:opacity-100 h-8 w-8 p-0"
                    aria-label={`Copiar ${label}`}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="pt-2">
                <Button onClick={exportCurrentColor} variant="outline" size="sm" className="w-full gap-2">
                  <FileDown className="w-4 h-4" />
                  <span>Exportar JSON desta cor</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Inputs */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="group hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              RGB
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <NumberInput
                label="R"
                value={rgb.r}
                min={0}
                max={255}
                onChange={(v) => updateFrom("RGB", { ...rgb, r: v })}
              />
              <NumberInput
                label="G"
                value={rgb.g}
                min={0}
                max={255}
                onChange={(v) => updateFrom("RGB", { ...rgb, g: v })}
              />
              <NumberInput
                label="B"
                value={rgb.b}
                min={0}
                max={255}
                onChange={(v) => updateFrom("RGB", { ...rgb, b: v })}
              />
            </div>
          </CardContent>
        </Card>

  <Card className="group hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">CMYK</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="C"
                value={cmyk.c}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                onChange={(v) => updateFrom("CMYK", { ...cmyk, c: v })}
              />
              <NumberInput
                label="M"
                value={cmyk.m}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                onChange={(v) => updateFrom("CMYK", { ...cmyk, m: v })}
              />
              <NumberInput
                label="Y"
                value={cmyk.y}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                onChange={(v) => updateFrom("CMYK", { ...cmyk, y: v })}
              />
              <NumberInput
                label="K"
                value={cmyk.k}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                onChange={(v) => updateFrom("CMYK", { ...cmyk, k: v })}
              />
            </div>
          </CardContent>
        </Card>

  <Card className="group hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">HSL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <NumberInput
                label="H"
                value={hsl.h}
                min={0}
                max={360}
                step={0.1}
                suffix="°"
                onChange={(v) => updateFrom("HSL", { ...hsl, h: v })}
              />
              <NumberInput
                label="S"
                value={hsl.s}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                onChange={(v) => updateFrom("HSL", { ...hsl, s: v })}
              />
              <NumberInput
                label="L"
                value={hsl.l}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                onChange={(v) => updateFrom("HSL", { ...hsl, l: v })}
              />
            </div>
          </CardContent>
        </Card>

  <Card className="group hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">HSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <NumberInput
                label="H"
                value={hsv.h}
                min={0}
                max={360}
                step={0.1}
                suffix="°"
                onChange={(v) => updateFrom("HSV", { ...hsv, h: v })}
              />
              <NumberInput
                label="S"
                value={hsv.s}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                onChange={(v) => updateFrom("HSV", { ...hsv, s: v })}
              />
              <NumberInput
                label="V"
                value={hsv.v}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                onChange={(v) => updateFrom("HSV", { ...hsv, v: v })}
              />
            </div>
          </CardContent>
        </Card>

  <Card className="group hover:shadow-md transition-all duration-200 sm:col-span-2 xl:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">HEX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Código Hexadecimal</label>
                  <div className="relative">
                <input
                  className="w-full px-3 py-2 bg-input border border-border rounded-md font-mono uppercase tracking-wide text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200"
                  value={hexDraft}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^#0-9a-fA-F]/g,'').toUpperCase()
                    setHexDraft(val)
                    const cleaned = val.startsWith('#')? val : '#'+val
                    const pure = cleaned.replace('#','')
                    if (pure.length===3 || pure.length===6) {
                      updateFrom('HEX', cleaned)
                    }
                  }}
                  maxLength={7}
                  placeholder="#3B1E54"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(hexDraft)}
                  className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-muted"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Formato: #RRGGBB</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}

<div align="center">
	<h1>🎨 Conversor de Cores Interativo</h1>
	<p>Ferramenta web para converter e explorar cores entre os modelos HEX, RGB, CMYK, HSL e HSV, gerar variações (tints & shades) e exportar dados da cor.</p>
</div>

## ✨ Visão Geral
Aplicação construída em **Next.js (App Router)** com **React 18** e **TypeScript**. Mantém um estado canônico em RGB e deriva automaticamente todos os outros modelos. Permite edição em qualquer formato, histórico recente, gerar/remover variações e exportar a cor atual em JSON.

## 🚀 Funcionalidades
- Conversões em tempo real entre: HEX, RGB, CMYK, HSL, HSV
- Entrada síncrona (alterar em um modelo atualiza todos os outros)
- Campo HEX tolerante (#RGB ou #RRGGBB) com digitação incremental
- Slider + input numérico para cada canal (precisão 0.1 em HSL/HSV/CMYK)
- Picker HSV próprio (quadrado Saturation/Value + slider de Hue)
- Histórico das últimas 8 cores (persistido em localStorage)
- Geração de variações (tints & shades) com toggle (abrir/fechar)
- Limpa variações automaticamente ao trocar a cor base
- Reordenar variações por drag & drop
- Exportar JSON da cor atual (todos os modelos)
- Copiar qualquer linha consolidada (HEX/RGB/CMYK/HSL/HSV)

## 🧠 Como as Conversões Funcionam (Resumo)
O estado canônico é um objeto RGB `{ r, g, b }` (0–255). Funções puras realizam:
- `rgbToCmyk` / `cmykToRgb`: Fórmula clássica usando K = 1 - max(R,G,B).
- `rgbToHsl` / `hslToRgb`: Usa delta (max-min) para calcular Hue por setor e saturação baseada em L.
- `rgbToHsv` / `hsvToRgb`: Semelhante ao HSL, porém V = max(R,G,B) e S = delta/max.
- `rgbToHex` / `hexToRgb`: Conversão direta de componentes para base 16 (aceita 3 ou 6 dígitos).

O dispatcher `toRgb(model, value)` garante que qualquer entrada seja normalizada para RGB; depois `fromRgb(rgb)` gera todas as demais representações.

## 🎨 Geração de Variações
Quando você clica em “Variações”, o algoritmo:
1. Define a cor base em RGB.
2. Define dois alvos: branco (255,255,255) e preto (0,0,0).
3. Usa fatores (0.15, 0.30, 0.45) e interpola linearmente: `novo = base + (alvo - base) * fator`.
4. Cria 3 tints (aproxima da luz) e 3 shades (aproxima da sombra).
5. Marca cada uma como `generated: true` para poder remover depois.
6. Segundo clique em “Fechar Variações” remove apenas as geradas.
7. Se a cor base muda, variações antigas são limpas automaticamente.

## 🗃 Persistência
- `localStorage` salva: `color-history` (últimas 8) e `color-pinned` (variações atuais).
- Dados são restaurados no carregamento inicial.

## ♿ Acessibilidade & UX
- Botões possuem `aria-label` onde necessário.
- Foco visível com `focus:ring`.
- Nomes de cores/valores facilmente copiáveis.

## 🏗 Estrutura Simplificada
```
src/
	app/
		page.tsx         (monta a página principal)
		layout.tsx       (layout/base fonts)
		globals.css      (tema + tokens)
	components/
		ColorConverter.tsx  (lógica + UI principal)
	lib/
		color.ts            (todas as conversões)
```

## 🔧 Scripts
```bash
npm run dev     # Ambiente de desenvolvimento
npm run build   # Build de produção
npm start       # Rodar build (se configurado)
```

## 📦 Exportar Dados da Cor
Botão “Exportar JSON desta cor” gera um arquivo com:
```json
{
	"hex": "#RRGGBB",
	"rgb": { "r": 0, "g": 0, "b": 0 },
	"cmyk": { "c": 0, "m": 0, "y": 0, "k": 0 },
	"hsl": { "h": 0, "s": 0, "l": 0 },
	"hsv": { "h": 0, "s": 0, "v": 0 }
}
```

## 🧪 Ideias Futuras
- Paleta complementar / análoga automática
- Modo contraste (verifica WCAG entre foreground/background)
- Exportar como CSS variables / Tailwind config
- Suporte LAB / LCH

## Autor
`guiyugidev`

## 📄 Licença
Definir licença (ex: MIT) se desejar distribuição pública.

---
Sinta-se livre para sugerir melhorias ou abrir issues. Bom código e boas cores! 🎨

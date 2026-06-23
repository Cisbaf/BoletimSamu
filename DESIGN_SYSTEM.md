# 🎨 Design System - CISBAF / Business Brain

> **Status:** Proposta Arquitetural | **Versão:** 1.0 | **Data:** Junho 2026

---

## 📋 Índice

1. [Filosofia de Design](#filosofia-de-design)
2. [Paleta de Cores](#paleta-de-cores)
3. [Tipografia](#tipografia)
4. [Componentes Principais](#componentes-principais)
5. [Padrões de Layout](#padrões-de-layout)
6. [Hierarquia Visual](#hierarquia-visual)
7. [Estado e Feedback](#estado-e-feedback)
8. [Implementação & Roadmap](#implementação--roadmap)

---

## 🎯 Filosofia de Design

### Princípios Centrais

Este Design System é construído para o **Business Brain** — o sistema central de conhecimento, automação, desenvolvimento e aprendizado da organização. Deve ser:

| Princípio | Descrição |
|-----------|-----------|
| **Escalável** | Adapta-se a múltiplos sócios, lojas, marcas, produtos e workflows |
| **Intuitivo** | Usuários leigos entendem o fluxo sem treinamento |
| **Confiável** | Transmite segurança em processos críticos (boletins, documentos, registros) |
| **Consistente** | Padrões únicos em todos os módulos e subsistemas |
| **Acessível** | WCAG 2.1 AA mínimo; suporta leitores de tela |
| **Performance** | Carregamento rápido; prioriza conteúdo sobre estetismo |

### Público

- **Primário:** Cidadãos solicitando cópias de documentos (não-técnico)
- **Secundário:** Administradores (média competência técnica)
- **Terciário:** Agentes automáticos, integrações, workflows futuros

---

## 🎨 Paleta de Cores

### Core Colors

```
├── Brand Primary (Azul)
│   ├── 50  #F0F4FF   (lightest - backgrounds, hovers)
│   ├── 100 #E0EBFF
│   ├── 200 #C1D7FF
│   ├── 300 #9BB8FF
│   ├── 400 #6B93FF
│   ├── 500 #1E63E9  ⭐ PRIMARY (botões, links, ícones ativos)
│   ├── 600 #174FCC
│   ├── 700 #123EA3
│   ├── 800 #0E2B7A
│   └── 900 #081651

├── Brand Secondary (Amarelo/Ouro)
│   ├── 50  #FFFAF0
│   ├── 100 #FFF5D0
│   ├── 200 #FFE9A0
│   ├── 300 #FFDC70
│   ├── 400 #F5D840
│   ├── 500 #F5B800  ⭐ SECONDARY (destaque, avisos)
│   ├── 600 #D4A200
│   └── 700 #B38C00

├── Status & Semantics
│   ├── Success Green    #10B981 (ações positivas, confirmações)
│   ├── Error Red        #E03131 (erros, deletar, avisos críticos)
│   ├── Warning Orange   #F59E0B (atenção, processos pendentes)
│   └── Info Blue        #0EA5E9 (informações, dicas)

├── Neutros
│   ├── White           #FFFFFF
│   ├── Gray 50         #F9FAFB
│   ├── Gray 100        #F3F4F6
│   ├── Gray 200        #E5E7EB
│   ├── Gray 300        #D1D5DB
│   ├── Gray 400        #9CA3AF
│   ├── Gray 500        #6B7280
│   ├── Gray 600        #4B5563
│   ├── Gray 700        #374151
│   ├── Gray 800        #1F2937
│   └── Gray 900        #111827

└── Shadows & Overlay
    ├── Dark Overlay    rgba(0, 0, 0, 0.3)
    ├── Shadow SM       0 1px 2px rgba(0,0,0,0.05)
    ├── Shadow MD       0 4px 6px rgba(0,0,0,0.1)
    └── Shadow LG       0 10px 15px rgba(0,0,0,0.1)
```

### Uso Contextual

```
┌─ BACKGROUNDS ─────────────────────┐
│ Página         → Gray 50 (#F9FAFB) │
│ Card/Painel    → White (#FFFFFF)  │
│ Overlay        → Dark Overlay     │
│ Hover          → Blue 50 (#F0F4FF)│
└────────────────────────────────────┘

┌─ TEXTOS ──────────────────────────┐
│ Primário       → Gray 900 (#111827)│
│ Secundário     → Gray 600 (#4B5563)│
│ Desabilitado   → Gray 400 (#9CA3AF)│
│ Inverso        → White (#FFFFFF)  │
└────────────────────────────────────┘

┌─ INTERAÇÕES ───────────────────────┐
│ Botão Primary  → Blue 500          │
│ Botão Hover    → Blue 600          │
│ Botão Active   → Blue 700          │
│ Link           → Blue 500          │
│ Link Visited   → Blue 700          │
└────────────────────────────────────┘

┌─ FEEDBACK ─────────────────────────┐
│ Success        → Green (#10B981)   │
│ Error          → Red (#E03131)     │
│ Warning        → Orange (#F59E0B)  │
│ Info           → Blue Cyan (#0EA5E9)│
└────────────────────────────────────┘
```

### Configuração Chakra UI

```typescript
// src/theme/index.ts - ATUALIZADO
export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        // Primary Brand
        brandBlue: {
          50: { value: "#F0F4FF" },
          100: { value: "#E0EBFF" },
          200: { value: "#C1D7FF" },
          300: { value: "#9BB8FF" },
          400: { value: "#6B93FF" },
          500: { value: "#1E63E9" },  // PRIMARY
          600: { value: "#174FCC" },
          700: { value: "#123EA3" },
          800: { value: "#0E2B7A" },
          900: { value: "#081651" },
        },
        // Secondary Brand
        brandYellow: {
          50: { value: "#FFFAF0" },
          100: { value: "#FFF5D0" },
          200: { value: "#FFE9A0" },
          300: { value: "#FFDC70" },
          400: { value: "#F5D840" },
          500: { value: "#F5B800" },  // SECONDARY
          600: { value: "#D4A200" },
          700: { value: "#B38C00" },
        },
        // Semantic
        success: { value: "#10B981" },
        error: { value: "#E03131" },
        warning: { value: "#F59E0B" },
        info: { value: "#0EA5E9" },
      },
      fonts: {
        heading: { value: "'Inter', 'Segoe UI', sans-serif" },
        body: { value: "'Inter', 'Segoe UI', sans-serif" },
        mono: { value: "'Fira Code', monospace" },
      },
    },
  },
})
```

---

## 🔤 Tipografia

### Família de Fontes

| Uso | Fonte | Fallback | Reason |
|-----|-------|----------|--------|
| Heading/UI | Inter | Segoe UI, sans-serif | Moderno, legível em telas, excelente para números |
| Body/Copy | Inter | Segoe UI, sans-serif | Consistência; Inter é ótima para web |
| Código/Técnico | Fira Code | Courier New, monospace | Monispace familiar; diferencia 0/O, 1/I/l |

### Scale & Weights

```
┌─ HEADINGS ────────────────────────┐
│ H1 - 36px / 44px  │ Bold (700)   │ Logo, página titles
│ H2 - 28px / 36px  │ Bold (700)   │ Seções principais
│ H3 - 24px / 32px  │ Semi (600)   │ Sub-seções
│ H4 - 20px / 28px  │ Semi (600)   │ Card titles
│ H5 - 16px / 24px  │ Semi (600)   │ Inputs, small titles
│ H6 - 14px / 20px  │ Semi (600)   │ Labels, captions
└────────────────────────────────────┘

┌─ BODY ────────────────────────────┐
│ Body Large  - 18px / 28px │ R     │ Introduções, destaques
│ Body        - 16px / 24px │ R (400)│ Texto padrão
│ Body Small  - 14px / 20px │ R     │ Descrições, hints
│ Caption     - 12px / 16px │ R     │ Timestamps, meta
│ Overline    - 11px / 14px │ Semi  │ Labels de status
└────────────────────────────────────┘
```

### Line Height & Letter Spacing

```
Headings:        line-height: 1.2   | letter-spacing: -0.01em
Body:            line-height: 1.5   | letter-spacing: 0
Small/Caption:   line-height: 1.4   | letter-spacing: 0.02em
Code:            line-height: 1.6   | letter-spacing: 0
```

### Implementação

```tsx
// src/theme/typography.ts
export const typographyTokens = {
  sizes: {
    h1: { fontSize: "36px", fontWeight: "700", lineHeight: "44px" },
    h2: { fontSize: "28px", fontWeight: "700", lineHeight: "36px" },
    h3: { fontSize: "24px", fontWeight: "600", lineHeight: "32px" },
    h4: { fontSize: "20px", fontWeight: "600", lineHeight: "28px" },
    h5: { fontSize: "16px", fontWeight: "600", lineHeight: "24px" },
    h6: { fontSize: "14px", fontWeight: "600", lineHeight: "20px" },
    
    bodyLarge: { fontSize: "18px", fontWeight: "400", lineHeight: "28px" },
    body: { fontSize: "16px", fontWeight: "400", lineHeight: "24px" },
    bodySmall: { fontSize: "14px", fontWeight: "400", lineHeight: "20px" },
    caption: { fontSize: "12px", fontWeight: "400", lineHeight: "16px" },
    overline: { fontSize: "11px", fontWeight: "600", lineHeight: "14px" },
  }
}
```

---

## 🧩 Componentes Principais

### 1. Button (Primário)

**Estados:** Default | Hover | Active | Disabled | Loading

```
┌──────────────────────────────────────┐
│ 🔵 Confirmar Solicitação            │ ← Blue 500
│ bg: Blue 500 | fg: White             │
│ padding: 12px 24px | radius: 8px     │
│ shadow: md | transition: 150ms       │
│ hover → Blue 600                     │
│ active → Blue 700 + shadow lg        │
│ disabled → Gray 300 + cursor: n/a    │
└──────────────────────────────────────┘
```

### 2. Button (Secundário)

```
┌──────────────────────────────────────┐
│ ○ Cancelar                           │ ← Gray 600 outline
│ bg: White | fg: Gray 600             │
│ border: 1px Gray 300                 │
│ padding: 12px 24px | radius: 8px     │
│ hover → Gray 50 bg + Gray 700 fg     │
│ active → Gray 100 bg                 │
└──────────────────────────────────────┘
```

### 3. Card

```
┌────────────────────────────────────────┐
│ ╔══════════════════════════════════╗   │
│ ║ Card Title (H4)                  ║   │
│ ╟──────────────────────────────────╢   │
│ ║ Card content                      ║   │
│ ║ - Item 1                          ║   │
│ ║ - Item 2                          ║   │
│ ║                                   ║   │
│ ║ [Primary Button] [Secondary Btn] ║   │
│ ╚══════════════════════════════════╝   │
│                                         │
│ bg: White                               │
│ padding: 24px                           │
│ radius: 12px                            │
│ border: 1px Gray 200                    │
│ shadow: sm                              │
│ hover → shadow md (subtle lift)         │
└────────────────────────────────────────┘
```

### 4. Input Field

```
┌──────────────────────────────────────┐
│ Label (H6, Gray 700)                 │
│                                       │
│ ┌────────────────────────────────┐   │
│ │ [  Placeholder text here...  ] │   │
│ └────────────────────────────────┘   │
│                                       │
│ Helper text (12px, Gray 500)         │
│                                       │
│ Focus state:                          │
│ ├─ border: 2px Blue 500              │
│ ├─ shadow: 0 0 0 3px Blue 50        │
│ ├─ bg: Blue 50 (subtle)              │
│                                       │
│ Error state:                          │
│ ├─ border: 2px Red 500               │
│ ├─ helper: Red 500                   │
│ ├─ icon: 🔴 (ícone de erro)          │
└──────────────────────────────────────┘
```

### 5. Status Badge

```
Status: ✓ Confirmado          Status: ⏳ Aguardando
bg: Green 50                  bg: Yellow 50
fg: Green 700                 fg: Yellow 800
border: 1px Green 200         border: 1px Yellow 200
icon: ✓ Green 500            icon: ⏳ Yellow 600
```

### 6. Timeline

```
┌─────────────────────────────────────┐
│                                     │
│  📋 Solicitação Recebida            │
│  13 de Junho, 10:30                 │
│  ✓ Confirmado                       │
│  ├── Documento identificado         │
│      └─ Cópia #2024-001             │
│                                     │
│  ──────────────────────────────────  ← Separador
│                                     │
│  🔍 Em Processamento                │
│  Estimado: 15 de Junho              │
│  ⏳ Aguardando análise              │
│  ├── Revisor: João Silva            │
│      └─ Desde 14 de Junho           │
│                                     │
│  ──────────────────────────────────  │
│                                     │
│  📦 Pronto para Entrega             │
│  Dentro de 3 dias úteis             │
│  ⏳ Agendado                        │
│                                     │
└─────────────────────────────────────┘
```

### 7. Modal/Dialog

```
┌───────────────────────────────────────┐
│  ╔═══════════════════════════════╗    │
│  ║ Confirmar Ação            ✕   ║    │
│  ╟───────────────────────────────╢    │
│  ║                               ║    │
│  ║ Tem certeza que deseja        ║    │
│  ║ cancelar esta solicitação?    ║    │
│  ║                               ║    │
│  ║ Esta ação é irreversível.     ║    │
│  ║                               ║    │
│  ╟───────────────────────────────╢    │
│  ║  [Cancelar]  [Confirmar]      ║    │
│  ╚═══════════════════════════════╝    │
│                                       │
│ Overlay: Dark Overlay (fixed)         │
│ bg: White                             │
│ max-width: 480px                      │
│ radius: 12px                          │
│ shadow: lg                            │
│ animation: fade-in (150ms)            │
└───────────────────────────────────────┘
```

### 8. AppBar

```
┌─────────────────────────────────────────────────┐
│  [CISBAF]   Home  Solicitar  Acompanhar  [👤 ▼] │
│  Blue 500          Gray 600    Gray 600   Blue  │
│                    hover: Blue 600               │
│                                                  │
│  Mobile:                                        │
│  [CISBAF]                              [☰]     │
└─────────────────────────────────────────────────┘
```

---

## 📐 Padrões de Layout

### Grid System

```
12-column grid
├─ Desktop (≥1024px): 12 colunas
├─ Tablet (768-1023px): 8 colunas  
├─ Mobile (<768px): 4 colunas
└─ Gutter: 16px | Margin: 24px
```

### Container Sizes

```
Max-width breakpoints:
├─ sm: 640px   (max-width: 640px screens)
├─ md: 768px   (tablets)
├─ lg: 1024px  (desktops)
├─ xl: 1280px  (wide desktops)
└─ 2xl: 1536px (ultra-wide)

Safe Container (content):
└─ max-width: 1200px | margin: 0 auto | padding: 0 24px
```

### Spacing Scale

```
4px  (xs)
8px  (sm)
12px (md)
16px (lg)
24px (xl)
32px (2xl)
48px (3xl)
64px (4xl)

Uso:
├─ Heading margin-bottom  → 24px
├─ Card padding           → 24px
├─ Input margin-bottom    → 16px
├─ Horizontal gap (flex)  → 16px
└─ Section margin-top     → 48px
```

### Z-Index Scale

```
1    → Cards, relative content
10   → Sticky header/sidebar
100  → Dropdowns, tooltips
1000 → AppBar (sticky)
1100 → Modals, overlays
1200 → Notifications/Toasts (top-most)
```

---

## 🎭 Hierarquia Visual

### Páginas de Fluxo Primário (Home, Solicitar, Acompanhar)

```
┌─────────────────────────────────────────────────┐
│                    AppBar                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │  Hero Section                          │    │
│  │  H1: Solicite suas cópias              │    │
│  │  Body: Processo simples em 3 passos    │    │
│  │  [CTA Primary Button: Começar]         │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  ─────────────────────────────────────────      │ 48px gap
│                                                  │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ Feature 1    │ Feature 2    │ Feature 3    │ │
│  │ 🚀 Rápido    │ 🔒 Seguro    │ ✅ Simples   │ │
│  └──────────────┴──────────────┴──────────────┘ │
│                                                  │
│  ─────────────────────────────────────────      │ 48px gap
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │ FAQ / Próximos Passos                  │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│                     Footer                      │
└─────────────────────────────────────────────────┘
```

### Formulário (Solicitar)

```
┌─────────────────────────────────────────────────┐
│                    AppBar                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Stepper: Passo 1/3 - Dados Pessoais]         │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │ PASSO 1: DADOS PESSOAIS                │    │
│  ├────────────────────────────────────────┤    │
│  │                                         │    │
│  │ ┌──────────────┬──────────────────┐    │    │
│  │ │ Nome         │ CPF              │    │    │
│  │ │ [___________]│[___________]     │    │    │
│  │ └──────────────┴──────────────────┘    │    │
│  │                                         │    │
│  │ ┌──────────────┬──────────────────┐    │    │
│  │ │ Email        │ Telefone         │    │    │
│  │ │ [___________]│[___________]     │    │    │
│  │ └──────────────┴──────────────────┘    │    │
│  │                                         │    │
│  │ ┌─────────────────────────────────┐    │    │
│  │ │ Endereço (completo)             │    │    │
│  │ │ [_____________________________]  │    │    │
│  │ └─────────────────────────────────┘    │    │
│  │                                         │    │
│  │ [← Voltar]              [Próximo →]    │    │
│  └────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Estado e Feedback

### Estados de Button

| Estado | Visual | Comportamento |
|--------|--------|---------------|
| **Default** | Blue 500 bg, White fg | Cursor pointer, sem shadow |
| **Hover** | Blue 600 bg | Shadow md, cursor pointer |
| **Active/Focus** | Blue 700 bg + shadow lg | Pressionado |
| **Loading** | Blue 500 bg + spinner | Desabilitado, sem interação |
| **Disabled** | Gray 300 bg, Gray 400 fg | Cursor not-allowed |

### Estados de Input

| Estado | Visual | Feedback |
|--------|--------|----------|
| **Default** | Gray 200 border, Gray 600 fg | - |
| **Focus** | Blue 500 border (2px), Blue 50 bg, shadow | Border azul destaca input ativo |
| **Filled** | Gray 200 border, Gray 900 fg | Sem destaque (label sobe) |
| **Error** | Red 500 border, Red bg subtle | Ícone 🔴, helper text Red 500 |
| **Disabled** | Gray 200 border, Gray 400 fg | Cursor not-allowed, bg Gray 50 |
| **Success** | Green 500 border, Green ✓ icon | Feedback positivo |

### Feedback Visual

```
Toast Notifications (Chakra Toast)
├─ Success → Green bg, icon ✓
├─ Error   → Red bg, icon ✕
├─ Warning → Orange bg, icon ⚠
└─ Info    → Blue bg, icon ℹ

Position: Bottom-right
Animation: Slide-in (200ms) | Slide-out (150ms)
Auto-dismiss: 4s (custom para cada contexto)
```

### Loading States

```
Skeleton Loading (Cards)
├─ Pulse animation
├─ Gray 200 → Gray 300 → Gray 200
├─ loop: 1.5s

Page Loading
├─ Loading overlay (optional)
├─ Spinner central
├─ Text "Carregando..."

Infinite Scroll
├─ Bottom spinner
├─ Load more on scroll
```

---

## 🏗️ Implementação & Roadmap

### Fase 1: Fundação (Semana 1-2)

✅ **Já existe:**
- Chakra UI configurado
- Cores brandBlue, brandYellow
- Componentes básicos (AppBar, Card)

🔧 **Implementar:**

```typescript
// 1. Expandir tokens de cor em src/theme/index.ts
colors: {
  brandBlue: { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 },
  brandYellow: { 50, 100, 200, 300, 400, 500, 600, 700 },
  semantic: { success, error, warning, info }
}

// 2. Adicionar tipografia
fonts: {
  heading: 'Inter',
  body: 'Inter',
  mono: 'Fira Code',
}
textStyles: {
  h1, h2, h3, h4, h5, h6,
  bodyLarge, body, bodySmall,
  caption, overline
}

// 3. Criar biblioteca src/components/ui/
Button.tsx        → Variantes: primary, secondary, tertiary, outline
Card.tsx          → Suporta header, footer, actions
Input.tsx         → Com validação e feedback
Label.tsx         → Acessibilidade (htmlFor)
Badge.tsx         → Status visual
Timeline.tsx      → Componente customizado
Modal.tsx         → Dialog wrapper
Toast.tsx         → Notificações
```

### Fase 2: Padrões & Documentação (Semana 2-3)

📚 **Documentação:**

```
docs/
├─ DESIGN_SYSTEM.md          (este arquivo)
├─ components/
│   ├─ Button.md
│   ├─ Input.md
│   ├─ Card.md
│   ├─ Timeline.md
│   └─ [...]
├─ patterns/
│   ├─ Forms.md
│   ├─ Modals.md
│   ├─ Notifications.md
│   └─ States.md
└─ accessibility/
    └─ WCAG.md
```

🎨 **Storybook (opcional, altamente recomendado):**

```bash
npm install --save-dev @storybook/react
npx storybook init
# src/stories/Button.stories.tsx
# src/stories/Input.stories.tsx
# [...]
```

### Fase 3: Refatoração de Componentes Existentes (Semana 3-4)

✨ **Refatorar para padrão:**

```typescript
// Estrutura padrão de componente
src/components/
├─ ui/                       (UI system - reutilizável)
│   ├─ Button.tsx
│   ├─ Input.tsx
│   ├─ Card.tsx
│   └─ [...]
├─ domain/                   (Lógica de negócio - específico)
│   ├─ DocumentCard.tsx      (Card com dados de documento)
│   ├─ RequestForm.tsx       (Form customizado)
│   └─ [...]
└─ layout/                   (Layout/estrutura)
    ├─ AppBar.tsx            (melhorado)
    ├─ Sidebar.tsx           (novo, se necessário)
    └─ Footer.tsx            (novo)
```

### Fase 4: Extensibilidade (Semana 4+)

🔗 **Para múltiplos sócios/lojas/marcas:**

```typescript
// src/theme/themes.ts - Suporte a customização por tenant
const themes = {
  default: createSystem(/* colors, fonts */),
  marca_a: createSystem(/* cores personalizadas marca A */),
  marca_b: createSystem(/* cores personalizadas marca B */),
}

// Usar via Context
const ThemeContext = createContext(themes.default)
<ThemeProvider theme={themes[selectedTenant]}>
  <App />
</ThemeProvider>
```

---

## 📊 Exemplo: Implementação de Button Escalável

```typescript
// src/components/ui/Button.tsx
import { Button as ChakraButton, ButtonProps, defineStyle } from "@chakra-ui/react"
import { ReactNode } from "react"

interface CisbafButtonProps extends ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "xs" | "sm" | "md" | "lg"
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  ...props
}: CisbafButtonProps) {
  
  const variantStyles = {
    primary: defineStyle({
      bg: "brandBlue.500",
      color: "white",
      _hover: { bg: "brandBlue.600", shadow: "md" },
      _active: { bg: "brandBlue.700", shadow: "lg" },
      _disabled: { bg: "gray.300", color: "gray.400", cursor: "not-allowed" },
    }),
    secondary: defineStyle({
      bg: "white",
      color: "gray.600",
      border: "1px solid",
      borderColor: "gray.300",
      _hover: { bg: "gray.50", color: "gray.700" },
      _active: { bg: "gray.100" },
    }),
    // outline, ghost...
  }

  return (
    <ChakraButton
      variant={variant}
      size={size}
      isLoading={isLoading}
      {...variantStyles[variant]}
      {...props}
    />
  )
}
```

---

## 🎯 Decisões Arquiteturais Registradas

| Decisão | Justificativa | Impacto |
|---------|---------------|--------|
| **Chakra UI** | Já configurado; ótima acessibilidade | Mantém stack existente |
| **Inter font** | Moderna, legível, web-ready | Sem dependências extras |
| **12-column grid** | Padrão da indústria; flexível | Rápido prototipagem |
| **Tema único base + customização** | Escalável para múltiplas marcas | Reduz duplicação |
| **Sem Storybook inicial** | MVP mais rápido | Adicionar em Fase 2 |
| **Documentação em MD** | Controle de versão + git-friendly | Fácil manutenção |

---

## 📝 Próximos Passos

- [ ] Validar paleta de cores com stakeholders
- [ ] Implementar Fase 1 (tokens + componentes base)
- [ ] Criar Storybook com exemplos
- [ ] Refatorar componentes existentes
- [ ] Documentar padrões de acessibilidade
- [ ] Preparar sistema de temas para múltiplos tenants
- [ ] Realizar audit WCAG 2.1
- [ ] Medir performance de carregamento

---

**Versão:** 1.0 | **Última atualização:** 23/06/2026  
**Responsável:** Project Architect  
**Status:** Sob revisão

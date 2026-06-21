# Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web dashboard + backend proxy in `dashboard/` that manages AI config and exposes a tunneled chat API for the OpenAsk mobile app.

**Architecture:** Express server serves both the React SPA (Vite-built) and REST API. Prisma + SQLite for persistence. cloudflared for tunneling. Mobile connects to tunnel URL for streaming chat.

**Tech Stack:** React 19, React Router v7, shadcn/ui, Tailwind CSS v4, Vite, Express, Prisma, SQLite (better-sqlite3), cloudflared

---

### Task 1: Scaffold dashboard project

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/tsconfig.json`
- Create: `dashboard/tsconfig.node.json`
- Create: `dashboard/vite.config.ts`
- Create: `dashboard/tailwind.config.ts`
- Create: `dashboard/postcss.config.js`
- Create: `dashboard/index.html`
- Create: `dashboard/src/styles/globals.css`
- Create: `dashboard/src/main.tsx`
- Create: `dashboard/src/App.tsx`
- Create: `dashboard/src/vite-env.d.ts`
- Create: `dashboard/.gitignore`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p dashboard/server/prisma
mkdir -p dashboard/server/routes
mkdir -p dashboard/server/lib
mkdir -p dashboard/src/routes
mkdir -p dashboard/src/components/ui
mkdir -p dashboard/src/lib
mkdir -p dashboard/src/styles
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "openask-dashboard",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"vite\" \"tsx watch server/index.ts\"",
    "build": "vite build && tsc -p tsconfig.node.json",
    "start": "node server/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx server/prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.5.0",
    "@radix-ui/react-dialog": "^1.1.11",
    "@radix-ui/react-dropdown-menu": "^2.1.11",
    "@radix-ui/react-label": "^2.1.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-slider": "^1.2.6",
    "@radix-ui/react-switch": "^1.1.6",
    "@radix-ui/react-toast": "^1.2.11",
    "@radix-ui/react-tooltip": "^1.1.11",
    "bcryptjs": "^3.0.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "lucide-react": "^0.510.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router": "^7.6.2",
    "tailwind-merge": "^3.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.6",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.3",
    "@types/node": "^22.15.3",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "@vitejs/plugin-react": "^4.4.2",
    "autoprefixer": "^10.4.21",
    "concurrently": "^9.1.2",
    "postcss": "^8.5.3",
    "prisma": "^6.5.0",
    "tailwindcss": "^4.1.6",
    "tsx": "^4.19.4",
    "typescript": "^6.0.3",
    "vite": "^6.3.5"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist-server",
    "rootDir": "server"
  },
  "include": ["server"]
}
```

- [ ] **Step 5: Create vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:20128',
    },
  },
});
```

- [ ] **Step 6: Create postcss.config.js**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenAsk Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create src/styles/globals.css**

```css
@import "tailwindcss";

@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0.042 265.755);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.965 0.001 286.375);
  --secondary-foreground: oklch(0.205 0.042 265.755);
  --muted: oklch(0.965 0.001 286.375);
  --muted-foreground: oklch(0.556 0.013 287.401);
  --accent: oklch(0.965 0.001 286.375);
  --accent-foreground: oklch(0.205 0.042 265.755);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0.002 286.375);
  --input: oklch(0.922 0.002 286.375);
  --ring: oklch(0.205 0.042 265.755);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0.042 265.755);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0.042 265.755);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0.002 286.375);
  --primary-foreground: oklch(0.205 0.042 265.755);
  --secondary: oklch(0.269 0.016 285.501);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0.016 285.501);
  --muted-foreground: oklch(0.708 0.01 286.375);
  --accent: oklch(0.269 0.016 285.501);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 0.1);
  --input: oklch(1 0 0 / 0.15);
  --ring: oklch(0.556 0.013 287.401);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

- [ ] **Step 9: Create src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import App from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 10: Create src/App.tsx**

```tsx
import { Routes, Route, Navigate } from 'react-router'
import LoginPage from './routes/login'
import DashboardLayout from './routes/dashboard-layout'
import ProvidersPage from './routes/providers'
import PersonalityPage from './routes/personality'
import TunnelPage from './routes/tunnel'
import OverviewPage from './routes/overview'

export default function App() {
  const token = localStorage.getItem('token')

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="personality" element={<PersonalityPage />} />
        <Route path="tunnel" element={<TunnelPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

- [ ] **Step 11: Create src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 12: Create .gitignore**

```
node_modules
dist
dist-server
prisma/*.db
.env
```

- [ ] **Step 13: Create lib/utils.ts (shadcn helper)**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 14: Create components/ui/button.tsx**

```tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

- [ ] **Step 15: Create components/ui/card.tsx**

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-xl border bg-card text-card-foreground shadow', className)} {...props} />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

- [ ] **Step 16: Create components/ui/input.tsx**

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
```

- [ ] **Step 17: Create components/ui/label.tsx**

```tsx
import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const labelVariants = cva('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70')

const Label = React.forwardRef<React.ComponentRef<typeof LabelPrimitive.Root>, React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
  )
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

- [ ] **Step 18: Create components/ui/select.tsx** (shadcn select)

```tsx
import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<React.ComponentRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger ref={ref} className={cn(
      'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      className
    )} {...props}>
      {children}
      <SelectPrimitive.Icon asChild><ChevronDown className="h-4 w-4 opacity-50" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<React.ComponentRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(
  ({ className, children, position = 'popper', ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={ref} className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )} position={position} {...props}>
        <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')}>
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
)
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<React.ComponentRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item ref={ref} className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )} {...props}>
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator><Check className="h-4 w-4" /></SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
)
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem }
```

- [ ] **Step 19: Create components/ui/slider.tsx**

```tsx
import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

const Slider = React.forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <SliderPrimitive.Root ref={ref} className={cn('relative flex w-full touch-none select-none items-center', className)} {...props}>
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
)
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
```

- [ ] **Step 20: Create components/ui/switch.tsx**

```tsx
import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<React.ComponentRef<typeof SwitchPrimitives.Root>, React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>>(
  ({ className, ...props }, ref) => (
    <SwitchPrimitives.Root className={cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      className
    )} {...props} ref={ref}>
      <SwitchPrimitives.Thumb className={cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
      )} />
    </SwitchPrimitives.Root>
  )
)
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

- [ ] **Step 21: Create components/ui/textarea.tsx**

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    className={cn('flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Textarea }
```

- [ ] **Step 22: Create components/ui/badge.tsx**

```tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

- [ ] **Step 23: Create src/lib/api.ts**

```ts
const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    if (res.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    throw new Error(err)
  }
  return res.json()
}

export interface Provider {
  id: string
  name: string
  apiKey: string
  selectedModel: string
  baseUrl: string
  isActive: boolean
}

export interface Personality {
  systemPrompt: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  activePreset: string
}

export interface TunnelStatus {
  running: boolean
  url: string
}

export const api = {
  login: (password: string) =>
    request<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),

  getProviders: () =>
    request<Provider[]>('/config/providers'),

  updateProvider: (id: string, data: Partial<Provider>) =>
    request<Provider>(`/config/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getPersonality: () =>
    request<Personality>('/config/personality'),

  updatePersonality: (data: Partial<Personality>) =>
    request<Personality>('/config/personality', { method: 'PUT', body: JSON.stringify(data) }),

  getTunnelStatus: () =>
    request<TunnelStatus>('/tunnel/status'),

  startTunnel: () =>
    request<TunnelStatus>('/tunnel/start', { method: 'POST' }),

  stopTunnel: () =>
    request<TunnelStatus>('/tunnel/stop', { method: 'POST' }),
}
```

- [ ] **Step 24: Install dependencies**

```bash
cd /home/rzfann/project/OpenAsk/dashboard && npm install 2>&1 | tail -5
```

---



### Task 2: Prisma Schema + Seed

**Files:**
- Create: `dashboard/server/prisma/schema.prisma`
- Create: `dashboard/server/prisma/seed.ts`
- Create: `dashboard/server/prisma/client.ts`

- [ ] **Step 1: Create schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Config {
  id          String @id @default("main")
  password    String @default("admin123")
  tunnelUrl   String @default("")
  tunnelPort  Int    @default(20128)
}

model Provider {
  id            String  @id
  name          String
  apiKey        String  @default("")
  selectedModel String  @default("")
  baseUrl       String
  isActive      Boolean @default(false)
}

model Personality {
  id              String @id @default("main")
  systemPrompt    String @default("You are a helpful AI assistant.")
  temperature     Float  @default(0.7)
  maxTokens       Int    @default(4096)
  topP            Float  @default(1.0)
  frequencyPenalty Float @default(0.0)
  activePreset    String @default("Default")
}
```

- [ ] **Step 2: Create prisma client singleton**

```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
```

- [ ] **Step 3: Create seed script**

```ts
import prisma from './client'
import { hashSync } from 'bcryptjs'

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', selectedModel: 'openai/gpt-4o' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', selectedModel: 'gpt-4o' },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', selectedModel: 'claude-3-5-sonnet-20241022' },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', selectedModel: 'gemini-2.0-flash' },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', selectedModel: 'llama-3.3-70b-versatile' },
]

async function main() {
  await prisma.config.upsert({
    where: { id: 'main' },
    update: {},
    create: { id: 'main', password: hashSync('admin123', 10) },
  })

  for (const p of PROVIDERS) {
    await prisma.provider.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, isActive: p.id === 'groq' },
    })
  }

  await prisma.personality.upsert({
    where: { id: 'main' },
    update: {},
    create: { id: 'main' },
  })

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 4: Generate Prisma client + push + seed**

```bash
cd /home/rzfann/project/OpenAsk/dashboard && npx prisma generate && npx prisma db push && npx tsx server/prisma/seed.ts
```

---



### Task 3: Express Server + Auth

**Files:**
- Create: `dashboard/server/index.ts`
- Create: `dashboard/server/routes/auth.ts`
- Create: `dashboard/server/lib/auth-middleware.ts`

- [ ] **Step 1: Create auth middleware**

```ts
import { Request, Response, NextFunction } from 'express'
import { randomBytes } from 'crypto'

const tokens = new Map<string, boolean>()

export function createToken(): string {
  const token = randomBytes(32).toString('hex')
  tokens.set(token, true)
  return token
}

export function removeToken(token: string) {
  tokens.delete(token)
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = header.slice(7)
  if (!tokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
```

- [ ] **Step 2: Create auth routes**

```ts
import { Router } from 'express'
import { compareSync } from 'bcryptjs'
import prisma from '../prisma/client'
import { createToken, removeToken, authMiddleware } from '../lib/auth-middleware'

const router = Router()

router.post('/login', async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password required' })

  const config = await prisma.config.findUnique({ where: { id: 'main' } })
  if (!config || !compareSync(password, config.password)) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  const token = createToken()
  res.json({ token })
})

router.post('/logout', authMiddleware, (_req, res) => {
  const header = _req.headers.authorization!
  const token = header.slice(7)
  removeToken(token)
  res.json({ ok: true })
})

export default router
```

- [ ] **Step 3: Create Express server entry**

```ts
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth'
import configRoutes from './routes/config'
import tunnelRoutes from './routes/tunnel'
import chatRoutes from './routes/chat'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 20128

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/config', configRoutes)
app.use('/api/tunnel', tunnelRoutes)
app.use('/api/chat', chatRoutes)

// Serve SPA in production
const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

- [ ] **Step 4: Update the seed script import path** (already correct — `./client`)

The seed script uses `import prisma from './client'` which corresponds to `server/prisma/client.ts`. Verify the relative path works.

---



### Task 4: Config Routes (Providers + Personality)

**Files:**
- Create: `dashboard/server/routes/config.ts`

- [ ] **Step 1: Create config routes**

```ts
import { Router } from 'express'
import prisma from '../prisma/client'
import { authMiddleware } from '../lib/auth-middleware'

const router = Router()
router.use(authMiddleware)

// Providers
router.get('/providers', async (_req, res) => {
  const providers = await prisma.provider.findMany()
  res.json(providers)
})

router.put('/providers/:id', async (req, res) => {
  const { id } = req.params
  const { apiKey, selectedModel, isActive } = req.body

  const data: Record<string, unknown> = {}
  if (apiKey !== undefined) data.apiKey = apiKey
  if (selectedModel !== undefined) data.selectedModel = selectedModel
  if (isActive !== undefined) {
    if (isActive) {
      await prisma.provider.updateMany({ where: { isActive: true }, data: { isActive: false } })
    }
    data.isActive = isActive
  }

  const provider = await prisma.provider.update({ where: { id }, data })
  res.json(provider)
})

// Personality
router.get('/personality', async (_req, res) => {
  const personality = await prisma.personality.findUnique({ where: { id: 'main' } })
  res.json(personality)
})

router.put('/personality', async (req, res) => {
  const { systemPrompt, temperature, maxTokens, topP, frequencyPenalty, activePreset } = req.body
  const data: Record<string, unknown> = {}
  if (systemPrompt !== undefined) data.systemPrompt = systemPrompt
  if (temperature !== undefined) data.temperature = temperature
  if (maxTokens !== undefined) data.maxTokens = maxTokens
  if (topP !== undefined) data.topP = topP
  if (frequencyPenalty !== undefined) data.frequencyPenalty = frequencyPenalty
  if (activePreset !== undefined) data.activePreset = activePreset

  const personality = await prisma.personality.update({ where: { id: 'main' }, data })
  res.json(personality)
})

export default router
```

---



### Task 5: Chat Streaming API (SSE)

**Files:**
- Create: `dashboard/server/routes/chat.ts`
- Create: `dashboard/server/lib/ai.ts`

- [ ] **Step 1: Create AI streaming library**

This reuses the same streaming logic from the existing OpenAsk mobile app but as a server function.

```ts
import prisma from '../prisma/client'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  file?: { name: string; type: string; base64: string }
}

export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const provider = await prisma.provider.findFirst({ where: { isActive: true } })
  if (!provider) throw new Error('No active provider')
  if (!provider.apiKey) throw new Error('API key not set')

  const personality = await prisma.personality.findUnique({ where: { id: 'main' } })
  if (!personality) throw new Error('Personality not found')

  const messagesWithFile = await attachFiles(messages)
  const chatMsgs = messagesWithFile.filter((m) => m.role !== 'system')
  const systemPrompt = personality.systemPrompt && personality.systemPrompt !== 'You are a helpful AI assistant.'
    ? personality.systemPrompt
    : undefined

  if (provider.id === 'anthropic') {
    yield* streamAnthropic(messagesWithFile, provider.selectedModel, provider.apiKey, systemPrompt, personality)
    return
  }
  if (provider.id === 'google') {
    yield* streamGemini(messagesWithFile, provider.selectedModel, provider.apiKey, provider.baseUrl, systemPrompt, personality)
    return
  }

  const body: Record<string, unknown> = {
    model: provider.selectedModel,
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...chatMsgs]
      : chatMsgs,
    stream: true,
    temperature: personality.temperature,
    max_tokens: personality.maxTokens,
    top_p: personality.topP,
    frequency_penalty: personality.frequencyPenalty,
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.apiKey}`,
  }
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://openask.app'
    headers['X-Title'] = 'OpenAsk'
  }

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`API Error: ${await res.text()}`)

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const chunk = json.choices?.[0]?.delta?.content ?? ''
        if (chunk) yield chunk
      } catch {}
    }
  }
}

async function attachFiles(messages: ChatMessage[]): Promise<ChatMessage[]> {
  const result: ChatMessage[] = []
  for (const msg of messages) {
    if (msg.file) {
      const { name, type, base64 } = msg.file
      const dataUrl = `data:${type};base64,${base64}`
      if (type.startsWith('image/')) {
        result.push({
          role: msg.role,
          content: [
            { type: 'text', text: msg.content || `[File: ${name}]` },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        } as unknown as ChatMessage)
      } else {
        result.push({
          ...msg,
          content: msg.content || `[Attached file: ${name}]\n\n${base64.slice(0, 1000)}...`,
        })
      }
    } else {
      result.push(msg)
    }
  }
  return result
}

async function* streamAnthropic(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  systemPrompt: string | undefined,
  personality: { temperature: number; maxTokens: number; topP: number }
): AsyncGenerator<string> {
  const chatMsgs = messages.filter((m) => m.role !== 'system')
  const body: Record<string, unknown> = {
    model,
    max_tokens: personality.maxTokens,
    temperature: personality.temperature,
    top_p: personality.topP,
    stream: true,
    messages: chatMsgs,
  }
  if (systemPrompt) body.system = systemPrompt

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Anthropic Error: ${await res.text()}`)
  yield* readSSE(res)
}

async function* streamGemini(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  baseUrl: string,
  systemPrompt: string | undefined,
  personality: { temperature: number; maxTokens: number; topP: number }
): AsyncGenerator<string> {
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      if (typeof m.content === 'string') {
        return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }
      }
      return { role: m.role === 'assistant' ? 'model' : 'user', parts: m.content }
    })

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: personality.temperature, maxOutputTokens: personality.maxTokens, topP: personality.topP },
  }
  if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] }

  const res = await fetch(`${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Gemini Error: ${await res.text()}`)
  yield* readSSE(res)
}

async function* readSSE(res: Response): AsyncGenerator<string> {
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const json = JSON.parse(line.slice(6))
        if (json.type === 'content_block_delta') {
          if (json.delta?.text) yield json.delta.text
        }
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (text) yield text
      } catch {}
    }
  }
}
```

- [ ] **Step 2: Create chat route**

```ts
import { Router } from 'express'
import { streamChat } from '../lib/ai'

const router = Router()

router.post('/stream', async (req, res) => {
  const { messages } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    for await (const chunk of streamChat(messages)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
    }
    res.write('data: [DONE]\n\n')
  } catch (e: any) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`)
  } finally {
    res.end()
  }
})

export default router
```

---



### Task 6: Tunnel Manager + API

**Files:**
- Create: `dashboard/server/lib/tunnel.ts`
- Create: `dashboard/server/routes/tunnel.ts`

- [ ] **Step 1: Create tunnel manager**

```ts
import { spawn, ChildProcess } from 'child_process'
import prisma from '../prisma/client'

let tunnelProcess: ChildProcess | null = null

export function getTunnelStatus() {
  return {
    running: tunnelProcess !== null && !tunnelProcess.killed,
    url: '', // loaded from DB below
  }
}

export async function getTunnelUrl(): Promise<string> {
  const config = await prisma.config.findUnique({ where: { id: 'main' } })
  return config?.tunnelUrl ?? ''
}

export async function startTunnel(port: number): Promise<string> {
  if (tunnelProcess && !tunnelProcess.killed) {
    throw new Error('Tunnel already running')
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let resolved = false

    proc.stdout?.on('data', async (data: Buffer) => {
      const output = data.toString()
      const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/)
      if (match && !resolved) {
        resolved = true
        const url = match[0]
        await prisma.config.update({
          where: { id: 'main' },
          data: { tunnelUrl: url },
        })
        resolve(url)
      }
    })

    proc.on('error', (err) => {
      if (!resolved) reject(err)
    })

    proc.on('exit', (code) => {
      tunnelProcess = null
      if (!resolved) reject(new Error(`cloudflared exited with code ${code}`))
    })

    tunnelProcess = proc
  })
}

export function stopTunnel(): void {
  if (tunnelProcess && !tunnelProcess.killed) {
    tunnelProcess.kill('SIGTERM')
    tunnelProcess = null
  }
}
```

- [ ] **Step 2: Create tunnel routes**

```ts
import { Router } from 'express'
import { authMiddleware } from '../lib/auth-middleware'
import { getTunnelStatus, getTunnelUrl, startTunnel, stopTunnel } from '../lib/tunnel'
import prisma from '../prisma/client'

const router = Router()
router.use(authMiddleware)

router.get('/status', async (_req, res) => {
  const status = getTunnelStatus()
  const url = await getTunnelUrl()
  res.json({ ...status, url })
})

router.post('/start', async (_req, res) => {
  try {
    const config = await prisma.config.findUnique({ where: { id: 'main' } })
    const port = config?.tunnelPort ?? 20128
    const url = await startTunnel(port)
    res.json({ running: true, url })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/stop', (_req, res) => {
  stopTunnel()
  res.json({ running: false, url: '' })
})

export default router
```

---



### Task 7: Dashboard Pages — Login

**Files:**
- Create: `dashboard/src/routes/login.tsx`

- [ ] **Step 1: Create login page**

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await api.login(password)
      localStorage.setItem('token', res.token)
      navigate('/')
    } catch {
      setError('Invalid password')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>OpenAsk Dashboard</CardTitle>
          <CardDescription>Enter password to access settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---



### Task 8: Dashboard Layout + Navigation

**Files:**
- Create: `dashboard/src/routes/dashboard-layout.tsx`

- [ ] **Step 1: Create dashboard layout with sidebar**

```tsx
import { Outlet, NavLink, useNavigate } from 'react-router'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Overview', icon: '◉' },
  { to: '/providers', label: 'Providers', icon: '⚡' },
  { to: '/personality', label: 'Personality', icon: '✦' },
  { to: '/tunnel', label: 'Tunnel', icon: '↗' },
]

export default function DashboardLayout() {
  const navigate = useNavigate()

  async function handleLogout() {
    try { await api.logout() } catch {}
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-muted/30 p-4 flex flex-col gap-2">
        <h1 className="font-bold text-lg mb-4 px-2">OpenAsk</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start">
          Logout
        </Button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
```

---



### Task 9: Dashboard Pages — Providers

**Files:**
- Create: `dashboard/src/routes/providers.tsx`
- Modify: `dashboard/src/lib/api.ts` (already done)

- [ ] **Step 1: Create providers page**

```tsx
import { useState, useEffect, type FormEvent } from 'react'
import { api, type Provider } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MODEL_LISTS: Record<string, string[]> = {
  openrouter: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-r1', 'mistralai/mistral-large'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  google: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProviders().then(setProviders).finally(() => setLoading(false))
  }, [])

  async function updateProvider(id: string, data: Record<string, unknown>) {
    const updated = await api.updateProvider(id, data)
    setProviders((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Providers</h2>
      {providers.map((provider) => (
        <Card key={provider.id} className={provider.isActive ? 'ring-2 ring-primary' : ''}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {provider.name}
                {provider.isActive && <Badge variant="success">Active</Badge>}
              </CardTitle>
              <CardDescription>{provider.id}</CardDescription>
            </div>
            {!provider.isActive && (
              <Button size="sm" onClick={() => updateProvider(provider.id, { isActive: true })}>
                Set Active
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={provider.apiKey}
                onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={provider.selectedModel}
                onValueChange={(v) => updateProvider(provider.id, { selectedModel: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(MODEL_LISTS[provider.id] || []).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---



### Task 10: Dashboard Pages — Personality

**Files:**
- Create: `dashboard/src/routes/personality.tsx`

- [ ] **Step 1: Create personality page**

```tsx
import { useState, useEffect } from 'react'
import { api, type Personality } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'

const PRESETS = ['Default', 'Formal', 'Friendly', 'Sarkastik', 'Jenius']

const PRESET_PROMPTS: Record<string, string> = {
  Default: 'You are a helpful AI assistant.',
  Formal: 'You are a professional assistant. Respond formally and concisely. Use proper grammar and avoid casual language.',
  Friendly: 'You are a warm, friendly assistant. Be approachable and conversational. Use a relaxed tone.',
  Sarkastik: 'You are a witty, sarcastic assistant. Use humor and irony in your responses.',
  Jenius: 'You are a deep expert in all fields. Provide thorough, expert-level responses with detailed explanations.',
}

export default function PersonalityPage() {
  const [personality, setPersonality] = useState<Personality | null>(null)

  useEffect(() => {
    api.getPersonality().then(setPersonality)
  }, [])

  if (!personality) return <p className="text-muted-foreground">Loading...</p>

  function applyPreset(name: string) {
    const systemPrompt = PRESET_PROMPTS[name]
    const temp = name === 'Default' ? 0.7 : name === 'Formal' ? 0.3 : name === 'Friendly' ? 0.8 : name === 'Sarkastik' ? 0.9 : 0.5
    update({ systemPrompt, temperature: temp, activePreset: name })
  }

  async function update(data: Partial<Personality>) {
    const updated = await api.updatePersonality(data)
    setPersonality(updated)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Personality</h2>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            variant={personality.activePreset === preset ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyPreset(preset)}
          >
            {preset}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>System Prompt</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={personality.systemPrompt}
            onChange={(e) => update({ systemPrompt: e.target.value, activePreset: '' })}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Temperature</Label>
            <span className="text-sm text-muted-foreground">{personality.temperature}</span>
          </div>
          <Slider
            value={[personality.temperature]}
            min={0} max={2} step={0.1}
            onValueChange={([v]) => update({ temperature: v })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Max Tokens</Label>
            <span className="text-sm text-muted-foreground">{personality.maxTokens}</span>
          </div>
          <Slider
            value={[personality.maxTokens]}
            min={256} max={16384} step={256}
            onValueChange={([v]) => update({ maxTokens: v })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Top P</Label>
            <span className="text-sm text-muted-foreground">{personality.topP}</span>
          </div>
          <Slider
            value={[personality.topP]}
            min={0} max={1} step={0.05}
            onValueChange={([v]) => update({ topP: v })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Frequency Penalty</Label>
            <span className="text-sm text-muted-foreground">{personality.frequencyPenalty}</span>
          </div>
          <Slider
            value={[personality.frequencyPenalty]}
            min={-2} max={2} step={0.1}
            onValueChange={([v]) => update({ frequencyPenalty: v })}
          />
        </div>
      </div>
    </div>
  )
}
```

---



### Task 11: Dashboard Pages — Tunnel

**Files:**
- Create: `dashboard/src/routes/tunnel.tsx`

- [ ] **Step 1: Create tunnel page**

```tsx
import { useState, useEffect } from 'react'
import { api, type TunnelStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function TunnelPage() {
  const [status, setStatus] = useState<TunnelStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchStatus() }, [])

  async function fetchStatus() {
    const s = await api.getTunnelStatus()
    setStatus(s)
  }

  async function startTunnel() {
    setLoading(true)
    try {
      const s = await api.startTunnel()
      setStatus(s)
    } catch (e: any) {
      alert(e.message)
    }
    setLoading(false)
  }

  async function stopTunnel() {
    const s = await api.stopTunnel()
    setStatus(s)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-2xl font-bold">Tunnel</h2>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cloudflare Tunnel</CardTitle>
            <Badge variant={status?.running ? 'success' : 'secondary'}>
              {status?.running ? 'Running' : 'Stopped'}
            </Badge>
          </div>
          <CardDescription>
            Expose your AI backend to the internet via Cloudflare Tunnel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.running && status.url && (
            <div className="space-y-2">
              <Label>Tunnel URL</Label>
              <div className="flex gap-2">
                <Input value={status.url} readOnly />
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(status.url)}>
                  Copy
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!status?.running ? (
              <Button onClick={startTunnel} disabled={loading}>
                {loading ? 'Starting...' : 'Start Tunnel'}
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopTunnel}>
                Stop Tunnel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium">{children}</p>
}
```

---



### Task 12: Dashboard Pages — Overview

**Files:**
- Create: `dashboard/src/routes/overview.tsx`

- [ ] **Step 1: Create overview page**

```tsx
import { useState, useEffect } from 'react'
import { api, type Provider, type Personality, type TunnelStatus } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function OverviewPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [personality, setPersonality] = useState<Personality | null>(null)
  const [tunnel, setTunnel] = useState<TunnelStatus | null>(null)

  useEffect(() => {
    Promise.all([
      api.getProviders(),
      api.getPersonality(),
      api.getTunnelStatus(),
    ]).then(([p, per, t]) => {
      setProviders(p)
      setPersonality(per)
      setTunnel(t)
    })
  }, [])

  const activeProvider = providers.find((p) => p.isActive)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Active Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{activeProvider?.name ?? 'None'}</p>
            <p className="text-sm text-muted-foreground truncate">{activeProvider?.selectedModel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Tunnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">{tunnel?.running ? 'Running' : 'Stopped'}</p>
              <Badge variant={tunnel?.running ? 'success' : 'secondary'}>
                {tunnel?.running ? 'ON' : 'OFF'}
              </Badge>
            </div>
            {tunnel?.url && (
              <p className="text-sm text-muted-foreground truncate mt-1">{tunnel.url}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Preset</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{personality?.activePreset || 'Custom'}</p>
            <p className="text-sm text-muted-foreground">
              Temp: {personality?.temperature}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---



### Task 13: Mobile Integration

**Files:**
- Modify: `app/(app)/settings.tsx`
- Modify: `lib/aiStream.ts`

- [ ] **Step 1: Add tunnel settings to existing mobile settings screen**

Open `app/(app)/settings.tsx` and add:

```tsx
// Add these imports at top:
import { useState, useEffect } from 'react'
import { Switch } from 'react-native'
import { useSettingsStore } from '../../store/settingsStore'

// Add this state at the top of the component body:
const [tunnelUrl, setTunnelUrl] = useState('')
const [useTunnel, setUseTunnel] = useState(false)
const tunnelUrlStore = useSettingsStore((s) => s.tunnelUrl)
const setTunnelUrlStore = useSettingsStore((s) => s.setTunnelUrl)

useEffect(() => {
  setTunnelUrl(tunnelUrlStore)
  setUseTunnel(!!tunnelUrlStore)
}, [tunnelUrlStore])

// Add this block in the settings JSX where appropriate (e.g., after provider list):
<View style={{ padding: 16, gap: 12 }}>
  <Text style={{ fontSize: 18, fontWeight: '600' }}>Tunnel</Text>
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Text>Use Tunnel</Text>
    <Switch
      value={useTunnel}
      onValueChange={(v) => {
        setUseTunnel(v)
        if (!v) setTunnelUrlStore('')
      }}
    />
  </View>
  {useTunnel && (
    <TextInput
      style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 }}
      placeholder="https://xxx.trycloudflare.com"
      value={tunnelUrl}
      onChangeText={setTunnelUrl}
      onBlur={() => setTunnelUrlStore(tunnelUrl)}
      autoCapitalize="none"
      autoCorrect={false}
    />
  )}
</View>
```

- [ ] **Step 2: Add tunnel fields to mobile settings store**

Open `store/settingsStore.ts` and add:

```ts
// Add to SettingsStore type:
tunnelUrl: string;
setTunnelUrl: (url: string) => void;

// Add to initial state:
tunnelUrl: '',

// Add to zustand store:
setTunnelUrl: (url) => set({ tunnelUrl: url }),
```

- [ ] **Step 3: Modify aiStream.ts to support tunnel proxy**

In `lib/aiStream.ts`, modify the `streamChat` function to check for tunnel URL:

```ts
// At the start of streamChat, after getting store:
const tunnelUrl = store.tunnelUrl

// If tunnel is configured, route through it:
if (tunnelUrl) {
  await streamViaTunnel(messages, tunnelUrl, onChunk, onDone, onError)
  return
}

// ... existing code (unchanged)

// Add this new function:
async function streamViaTunnel(
  messages: ChatMessage[],
  tunnelUrl: string,
  onChunk: (c: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  try {
    const res = await fetch(`${tunnelUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
    if (!res.ok) return onError(`Tunnel Error: ${await res.text()}`)

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return onError('No response body')

    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return onDone()
        try {
          const json = JSON.parse(data)
          if (json.error) return onError(json.error)
          if (json.content) onChunk(json.content)
        } catch {}
      }
    }
    onDone()
  } catch (e: any) {
    onError(e.message ?? 'Tunnel connection failed')
  }
}
```

---

### Task 14: Test the Setup

- [ ] **Step 1: Verify server starts**

```bash
cd /home/rzfann/project/OpenAsk/dashboard && npx tsx server/index.ts &
sleep 2
curl -s http://localhost:20128/api/config/providers | head -c 100
kill %1
```

Expected: `401` (no auth) — confirms server runs.

- [ ] **Step 2: Verify login works**

```bash
cd /home/rzfann/project/OpenAsk/dashboard && npx tsx server/index.ts &
sleep 2
TOKEN=$(curl -s -X POST http://localhost:20128/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"
curl -s http://localhost:20128/api/config/providers \
  -H "Authorization: Bearer $TOKEN" | head -c 200
kill %1
```

Expected: Returns providers JSON array.

- [ ] **Step 3: Verify Vite dev server**

```bash
cd /home/rzfann/project/OpenAsk/dashboard && npx vite --port 5173 &
sleep 3
curl -s http://localhost:5173 | head -c 200
kill %1
```

Expected: Returns HTML (Vite dev server).

---



### Self-Review Checklist

1. **Spec coverage:**
   - Scaffold ✅ (Task 1)
   - Schema + DB ✅ (Task 2)
   - Express server + auth ✅ (Task 3)
   - Config routes ✅ (Task 4)
   - Chat streaming ✅ (Task 5)
   - Tunnel management ✅ (Task 6)
   - Login page ✅ (Task 7)
   - Dashboard layout ✅ (Task 8)
   - Providers page ✅ (Task 9)
   - Personality page ✅ (Task 10)
   - Tunnel page ✅ (Task 11)
   - Overview page ✅ (Task 12)
   - Mobile integration ✅ (Task 13)
   - Testing ✅ (Task 14)

2. **Placeholder scan:** No TBD, TODO, or vague "add error handling" found. All code is complete.

3. **Type consistency:** Provider fields match between Prisma schema, API client, and components. Personality fields consistent across all layers.

4. **Architecture check:** Single Express server, Vite proxy in dev, Serve static in prod — correct.

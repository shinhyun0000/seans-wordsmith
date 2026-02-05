# Sean's WordSmith - Coding Conventions

## 1. File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase.tsx | `LandingPage.tsx` |
| Service | camelCase.ts | `geminiService.ts` |
| Type/Interface | camelCase.ts | `types.ts` |
| Constants | camelCase.tsx | `constants.tsx` |
| Config | camelCase.config.ts | `vite.config.ts` |

## 2. Directory Structure

```
project-root/
├── components/     # React UI components
├── services/       # External API services
├── types.ts        # Shared type definitions
├── constants.tsx   # App-wide constants & config
├── App.tsx         # Root component
└── index.tsx       # Entry point
```

## 3. Naming Rules

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `WritingEditor` |
| Function | camelCase | `handleFetchSuggestions` |
| Constant | UPPER_SNAKE_CASE | `SYSTEM_PROMPT` |
| Interface | PascalCase | `ProjectState` |
| Enum | PascalCase + UPPER_SNAKE values | `WritingStep.TOPIC` |
| CSS Class | Tailwind utility classes | `bg-[#001F3F]` |
| Folder | kebab-case | `services/` |

## 4. Import Order

1. External libraries (`react`, `@google/genai`)
2. Internal types (`./types.ts`)
3. Internal constants (`./constants.tsx`)
4. Internal services (`./services/*`)
5. Internal components (`./components/*`)

## 5. Component Rules

- One primary component per file
- Props interface defined inline or in `types.ts`
- Use `React.FC<Props>` pattern
- State management via `useState` hooks

## 6. Environment Variables

- Store secrets in `.env.local` (gitignored via `*.local` pattern)
- Provide `.env.example` as template
- Access via Vite `define` config (`process.env.API_KEY`)

## 7. Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `navy` | `#001F3F` | Primary text, dark sections |
| `orange` | `#FF851B` | Accent, CTA, active states |
| `cream` | `#FDFCF8` | Background |
| `white` | `#FFFFFF` | Cards, panels |

## 8. AI Prompt Convention

- System prompt: 편집국장 역할 + 데이터 정확성 지침
- 문체: `~했다`, `~이다` 통일
- 팩트체크: Google Search grounding 필수

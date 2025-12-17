# Localization Guide for RealTimeX CRM

## Current Setup

RealTimeX CRM uses **React-Admin's i18n system** powered by [Polyglot.js](https://airbnb.io/polyglot.js/) for internationalization.

### Architecture

- **i18n Provider**: `src/components/atomic-crm/root/i18nProvider.tsx`
- **Current Language**: English (en) only
- **Framework**: `ra-i18n-polyglot` + `ra-language-english`
- **Translation Hook**: `useTranslate()` from `ra-core`
- **Language Switcher**: `LocalesMenuButton` component (auto-appears when multiple locales configured)

## How to Add New Languages

### Step 1: Install Language Package

React-Admin provides official translation packages for many languages:

```bash
npm install ra-language-french  # French
npm install ra-language-german  # German
npm install ra-language-spanish # Spanish
npm install ra-language-chinese # Chinese
# See full list: https://marmelab.com/react-admin/Translation.html
```

Or install Supabase-specific translations:

```bash
npm install ra-supabase-language-french
```

### Step 2: Update i18nProvider

Edit `src/components/atomic-crm/root/i18nProvider.tsx`:

```typescript
import { mergeTranslations } from "ra-core";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";
import frenchMessages from "ra-language-french";
import spanishMessages from "ra-language-spanish";
import { raSupabaseEnglishMessages } from "ra-supabase-language-english";
import { raSupabaseFrenchMessages } from "ra-supabase-language-french";

// Custom overrides
const raSupabaseEnglishMessagesOverride = {
  "ra-supabase": {
    auth: {
      password_reset: "Check your emails for a Reset Password message.",
    },
  },
};

const raSupabaseFrenchMessagesOverride = {
  "ra-supabase": {
    auth: {
      password_reset: "Vérifiez vos emails pour un message de réinitialisation.",
    },
  },
};

export const i18nProvider = polyglotI18nProvider(
  (locale) => {
    if (locale === "fr") {
      return mergeTranslations(
        frenchMessages,
        raSupabaseFrenchMessages,
        raSupabaseFrenchMessagesOverride,
      );
    }
    if (locale === "es") {
      return spanishMessages;
    }
    // Default to English
    return mergeTranslations(
      englishMessages,
      raSupabaseEnglishMessages,
      raSupabaseEnglishMessagesOverride,
    );
  },
  "en", // Default locale
  [
    { locale: "en", name: "English" },
    { locale: "fr", name: "Français" },
    { locale: "es", name: "Español" },
  ],
  { allowMissing: true },
);
```

### Step 3: Add Custom Translations

Create custom translation files for CRM-specific terms:

**`src/i18n/en.ts`**:
```typescript
export const customEnglishMessages = {
  crm: {
    menu: {
      dashboard: "Dashboard",
      contacts: "Contacts",
      companies: "Companies",
      deals: "Deals",
      tasks: "Tasks",
      settings: "Settings",
    },
    deal: {
      stages: {
        opportunity: "Opportunity",
        "proposal-sent": "Proposal Sent",
        "in-negociation": "In Negotiation",
        won: "Won",
        lost: "Lost",
        delayed: "Delayed",
      },
      categories: {
        copywriting: "Copywriting",
        "print-project": "Print Project",
        "ui-design": "UI Design",
        "website-design": "Website Design",
      },
    },
    note: {
      statuses: {
        cold: "Cold",
        warm: "Warm",
        hot: "Hot",
        "in-contract": "In Contract",
      },
    },
    task: {
      types: {
        email: "Email",
        demo: "Demo",
        lunch: "Lunch",
        meeting: "Meeting",
        "follow-up": "Follow-up",
        "thank-you": "Thank You",
        ship: "Ship",
        call: "Call",
      },
    },
  },
};
```

**`src/i18n/fr.ts`**:
```typescript
export const customFrenchMessages = {
  crm: {
    menu: {
      dashboard: "Tableau de bord",
      contacts: "Contacts",
      companies: "Entreprises",
      deals: "Affaires",
      tasks: "Tâches",
      settings: "Paramètres",
    },
    deal: {
      stages: {
        opportunity: "Opportunité",
        "proposal-sent": "Proposition envoyée",
        "in-negociation": "En négociation",
        won: "Gagné",
        lost: "Perdu",
        delayed: "Retardé",
      },
      categories: {
        copywriting: "Rédaction",
        "print-project": "Projet d'impression",
        "ui-design": "Conception UI",
        "website-design": "Conception de site web",
      },
    },
    // ... etc
  },
};
```

Then merge in i18nProvider:

```typescript
import { customEnglishMessages } from "@/i18n/en";
import { customFrenchMessages } from "@/i18n/fr";

export const i18nProvider = polyglotI18nProvider(
  (locale) => {
    if (locale === "fr") {
      return mergeTranslations(
        frenchMessages,
        raSupabaseFrenchMessages,
        customFrenchMessages,
      );
    }
    return mergeTranslations(
      englishMessages,
      raSupabaseEnglishMessages,
      customEnglishMessages,
    );
  },
  "en",
  [
    { locale: "en", name: "English" },
    { locale: "fr", name: "Français" },
  ],
  { allowMissing: true },
);
```

## Using Translations in Components

### Basic Usage

```typescript
import { useTranslate } from "ra-core";

function MyComponent() {
  const translate = useTranslate();

  return (
    <div>
      <h1>{translate("crm.menu.dashboard")}</h1>
      <p>{translate("crm.deal.stages.won")}</p>
    </div>
  );
}
```

### With Interpolation

```typescript
const translate = useTranslate();

translate("ra.message.created", { name: "Contact" });
// English: "Contact created"
// French: "Contact créé"
```

### With Pluralization

```typescript
translate("ra.navigation.page_rows_per_page", {
  _: "%{count} per page",
  smart_count: 10
});
```

## Translating Configuration Values

### Deal Stages, Categories, etc.

Instead of hardcoding values, use translation keys:

**Before**:
```typescript
export const defaultDealStages = [
  { value: "opportunity", label: "Opportunity" },
  { value: "won", label: "Won" },
];
```

**After**:
```typescript
export const defaultDealStages = [
  { value: "opportunity", label: "crm.deal.stages.opportunity" },
  { value: "won", label: "crm.deal.stages.won" },
];
```

Then in components:
```typescript
const translate = useTranslate();
const stages = dealStages.map(stage => ({
  ...stage,
  label: translate(stage.label)
}));
```

## Language Switcher

The `LocalesMenuButton` component automatically appears in the header when multiple locales are configured. It:
- Shows current locale as a button (e.g., "EN", "FR")
- Opens a dropdown with all available languages
- Persists selection to localStorage
- Auto-hides if only one language is available

## Database Content Localization

For localizing database content (contact notes, deal names, etc.), you have two options:

### Option 1: Separate Translation Tables

```sql
CREATE TABLE contact_translations (
  id bigint PRIMARY KEY,
  contact_id bigint REFERENCES contacts(id),
  locale text NOT NULL,
  title text,
  background text,
  UNIQUE(contact_id, locale)
);
```

### Option 2: JSONB Columns

```sql
ALTER TABLE contacts ADD COLUMN title_i18n jsonb;

-- Example data:
-- { "en": "Sales Manager", "fr": "Responsable commercial" }
```

Then in code:
```typescript
const translate = useTranslate();
const locale = useLocaleState()[0];
const title = contact.title_i18n?.[locale] || contact.title_i18n?.en;
```

## Email Templates Localization

Supabase email templates support language detection:

**`supabase/templates/invite.html`**:
```html
{{ if .Data.locale == "fr" }}
  <h1>Bienvenue dans RealTimeX CRM</h1>
  <p>Vous avez été invité à rejoindre l'équipe.</p>
{{ else }}
  <h1>Welcome to RealTimeX CRM</h1>
  <p>You've been invited to join the team.</p>
{{ end }}
```

Pass locale in Edge Function:
```typescript
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
  email,
  { data: { locale: "fr" } }
);
```

## Date and Number Formatting

Polyglot handles basic interpolation, but for dates/numbers, use browser APIs:

```typescript
import { useLocaleState } from "ra-core";

function DateDisplay({ date }: { date: Date }) {
  const [locale] = useLocaleState();

  const formatted = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);

  return <span>{formatted}</span>;
}
```

## Best Practices

1. **Never hardcode user-facing text** - Always use translation keys
2. **Namespace your keys** - Use prefixes like `crm.`, `app.`, etc.
3. **Keep translations flat** - Avoid deep nesting (max 3 levels)
4. **Use descriptive keys** - `crm.deal.won` not `deal1`
5. **Set allowMissing: true** - Falls back to key name during development
6. **Test with long strings** - German/French are often longer than English
7. **Use translation management tools** - Consider Crowdin, Lokalise, or POEditor for team workflows

## Available React-Admin Languages

- 🇬🇧 English (`ra-language-english`)
- 🇫🇷 French (`ra-language-french`)
- 🇩🇪 German (`ra-language-german`)
- 🇪🇸 Spanish (`ra-language-spanish`)
- 🇮🇹 Italian (`ra-language-italian`)
- 🇵🇹 Portuguese (`ra-language-portuguese`)
- 🇨🇳 Chinese (`ra-language-chinese`)
- 🇯🇵 Japanese (`ra-language-japanese`)
- 🇰🇷 Korean (`ra-language-korean`)
- 🇷🇺 Russian (`ra-language-russian`)
- 🇵🇱 Polish (`ra-language-polish`)
- 🇳🇱 Dutch (`ra-language-dutch`)
- 🇹🇷 Turkish (`ra-language-turkish`)
- 🇻🇳 Vietnamese (`ra-language-vietnamese`)
- And 50+ more...

See full list: https://marmelab.com/react-admin/Translation.html#available-locales

## RTL (Right-to-Left) Support

For Arabic, Hebrew, etc., React-Admin supports RTL automatically when locale is set:

```typescript
import arabicMessages from "ra-language-arabic";

export const i18nProvider = polyglotI18nProvider(
  (locale) => {
    if (locale === "ar") return arabicMessages;
    return englishMessages;
  },
  "en",
  [
    { locale: "en", name: "English" },
    { locale: "ar", name: "العربية" },
  ]
);
```

The `<Admin>` component automatically applies `dir="rtl"` to the HTML when an RTL locale is active.

## Testing Translations

```typescript
import { I18nProvider } from "ra-core";
import { render } from "@testing-library/react";
import { i18nProvider } from "./i18nProvider";

test("displays translated text", () => {
  const { getByText } = render(
    <I18nProvider i18nProvider={i18nProvider} locale="fr">
      <MyComponent />
    </I18nProvider>
  );

  expect(getByText("Tableau de bord")).toBeInTheDocument();
});
```

## Resources

- [React-Admin Translation Docs](https://marmelab.com/react-admin/Translation.html)
- [Polyglot.js Docs](https://airbnb.io/polyglot.js/)
- [ra-i18n-polyglot Package](https://www.npmjs.com/package/ra-i18n-polyglot)
- [Available Language Packs](https://github.com/marmelab/react-admin/tree/master/packages)

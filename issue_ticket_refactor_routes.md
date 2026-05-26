# Issue Ticket: Refactor App Routing Pages to Enforce "Thin Layer" Architecture

## Overview

In our project, we follow a clean architecture pattern where route pages (`src/app/**/page.tsx`) serve strictly as **thin entrypoints/wrappers**. They should only handle basic routing parameter passing or SSR layout shells, while the actual UI layout, business logic, state management, and page-level hooks are encapsulated in dedicated page components located in `src/components/pages/**`.

This keeps route definitions separate from UI logic, making page components reusable, testable, and easier to manage.

Currently, several pages violate this pattern by housing substantial inline JSX, business logic, and session-checking code directly in `src/app/**/page.tsx`.

---

## Pages Requiring Refactoring

Based on our architectural audit, the following **5 pages** do not follow the "thin layer in route pages" rule:

### 1. `src/app/(auth)/login/page.tsx`
- **Current State:** Houses extensive inline UI markup, tailwind layouts, brand assets, card containers, links to legal pages, and decorative canvas components. It imports `JournalIllustration` and `Card` directly.
- **Recommended Action:**
  - Create a new directory/file: `src/components/pages/auth/LoginPage.tsx` (or similar).
  - Move the JSX layout, cards, and decorative styles to `LoginPage.tsx`.
  - Update `src/app/(auth)/login/page.tsx` to simply render `<LoginPage />`.

### <h3>2. `src/app/(auth)/select-church/page.tsx`</h3>
- **Current State:** Contains 97 lines of code, including direct server-session retrieval (`getSessionUser()`), mapping of memberships, redirection logic, conditional grid layouts, and styled card links representing each church.
- **Recommended Action:**
  - Create a new file/component: `src/components/pages/auth/SelectChurchPage.tsx`.
  - Move the user-session parsing and grid list layout there, or pass the mapped memberships as props from the route wrapper.
  - Simplify the route page to only handle redirect gates and pass inputs into `<SelectChurchPage />`.

### <h3>3. `src/app/page.tsx` (Root Landing Page)</h3>
- **Current State:** Houses authentication retrieval and extensive session-to-perspective mapping for the navbar (admin vs member vs super-admin) along with direct rendering of the landing layout wrapper.
- **Recommended Action:**
  - Create `src/components/pages/landing/LandingPage.tsx`.
  - Move the navigation/state logic, session mapping, and root layout structure (`LandingNavbar`, `LandingHero`, `LandingFeatures`, etc.) into `<LandingPage />`.
  - Maintain `src/app/page.tsx` as a thin server-side layer that fetches the session and passes it down.

### <h3>4. `src/app/(legal)/privacy/page.tsx`</h3>
- **Current State:** Houses the raw text paragraphs and sections of the Privacy Policy directly in the Next.js page.
- **Recommended Action:**
  - Create `src/components/pages/landing/PrivacyPage.tsx` or `src/components/pages/legal/PrivacyPage.tsx`.
  - Move the policy article content to the component.
  - Make `src/app/(legal)/privacy/page.tsx` a thin import and render.

### <h3>5. `src/app/(legal)/terms/page.tsx`</h3>
- **Current State:** Houses the raw text paragraphs, list items, and sections of the Terms of Service.
- **Recommended Action:**
  - Create `src/components/pages/landing/TermsPage.tsx` or `src/components/pages/legal/TermsPage.tsx`.
  - Move the Terms text and layout into the page component.
  - Update `src/app/(legal)/terms/page.tsx` to a thin import and render.

---

## Implementation Guidelines
1. Ensure all new page components are added to the appropriate directory in `src/components/pages/`.
2. Keep route files (`page.tsx`) to **under 15 lines of code** where possible.
3. Keep server actions, authentication checks, and layout definitions cleanly decoupled from presentation.

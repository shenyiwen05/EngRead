# Frontend Style Redesign Design

Date: 2026-04-18

## Goal

Update the `context-reader/frontend` visual style to closely follow the `frontDesign` reference while preserving existing user-facing content, routes, data flow, and business behavior.

The selected direction is high-fidelity restructuring for core pages:

- `Dashboard`
- `Articles`
- `Import`
- `Reader`
- `Review`
- `Favorites`

`Login` and `Register` receive only baseline visual unification.

## Non-Goals

- Do not change visible product copy except where JSX structure requires moving the same text.
- Do not change API calls, stores, authentication behavior, article loading behavior, favorite behavior, or analysis polling.
- Do not introduce new product features.
- Do not replace the existing routing model.
- Do not port the whole `frontDesign` app verbatim.

## Reference Style

The reference design uses a quiet, editorial interface:

- Clean white or near-white page backgrounds.
- Thin gray borders instead of heavy shadows.
- Compact sticky top navigation.
- Generous page spacing, usually `px-6 py-12` for standard pages.
- Content containers around `max-w-[1200px]`.
- Reader layout around `max-w-[1400px]`.
- Cards with simple borders, white backgrounds, and radius no larger than 8px.
- Minimal color usage, with gray/black as the primary interface palette and teal reserved for reading annotations and status feedback.

## Architecture

The implementation should prefer existing application components and state logic. Styling changes will be applied through:

- Shared global CSS in `frontend/src/index.css`.
- Layout updates in `frontend/src/components/layout/AppLayout.tsx` and `TopNav.tsx`.
- Focused JSX class updates in page components.
- Reader-specific layout and annotation styling in `frontend/src/components/reader/*` and existing `.reader-*` CSS classes.

No new UI library should be introduced. The current Tailwind setup is sufficient.

## Page Design

### Shared Layout

`AppLayout` should provide the page shell and standard content widths:

- Standard pages use a `max-w-[1200px]` centered container with `px-6 py-12`.
- Reader pages use a wider `max-w-[1400px]` container with tighter top spacing.
- The shell remains white or near-white and avoids decorative backgrounds.

`TopNav` should move toward the reference header:

- Sticky at the top with a white background and subtle bottom border.
- Brand text stays `Context Reader`.
- Navigation labels remain unchanged: `我的文章`, `导入文章`, `收藏`.
- Active and hover states should be understated and stable.
- User nickname and logout remain present but visually quieter.

### Dashboard

Dashboard should resemble the reference `Dashboard` page:

- A simple welcome/introduction block at the top.
- The existing import entry remains present and prominent.
- System sample article section uses compact card grid.
- Recent reading section remains, preserving the existing recently-read prompt copy.
- Existing copy and article data source remain unchanged.

### Articles

The articles page keeps the existing filters and sorting behavior:

- Header row with page title and sort select.
- Filter buttons become quieter pills or compact buttons.
- Article cards align with the reference card density and metadata treatment.
- Empty and error states use the same bordered white message style as other pages.

### Import

Import should follow the reference form page:

- Wider single-column form, centered around the page content.
- Title input and article textarea use consistent border, padding, focus, and radius.
- Word count, validation, loading message, and copyright reminder stay unchanged.
- Primary and secondary buttons match the shared button treatment.

### Reader

Reader receives the most faithful restructuring:

- Header area follows the reference reader: back/context affordance, article metadata, and review link remain.
- Main layout uses three regions on large screens:
  - Left paragraph navigation.
  - Center reading canvas around 760px wide.
  - Right sticky explanation panel around 340-360px wide.
- Existing `data-testid` attributes should remain stable where tests depend on them.
- Reading typography remains serif, with comfortable line height.
- Sentence hover, translation reveal, phrase highlight, familiar-word mark, long-sentence label, breakdown panel, and explanation panel continue to work.
- On smaller screens, the support panel may remain sticky at bottom as currently implemented.

### Review

Review keeps its current article summary and three review groups:

- Header with title and return link.
- Summary as a bordered white block.
- Three review cards laid out in a responsive grid.
- Typography and spacing should match the reference card system.

### Favorites

Favorites keeps current filters and favorite cards:

- Header and filter row follow the Articles page pattern.
- Favorite cards use consistent bordered white cards.
- Empty state remains `还没有收藏。`.

### Login and Register

Login and Register are out of the core high-fidelity scope:

- Keep the same fields, validation, links, and behavior.
- Align background, panel, input, and button styling with the new shared visual language.
- Avoid large structural rewrites unless needed for visual consistency.

## Data Flow

The redesign must not change data flow:

- Article loading still uses `listArticles`, `getArticle`, `getAnalysisStatus`, and `analyzeArticle`.
- Auth state still comes from `useAuthStore`.
- Favorites still come from `useFavoriteStore`.
- Reader selection still flows through `ReaderPage` into `ReaderLayout` and `ExplanationPanel`.

## Error Handling

Existing error and loading states should remain behaviorally unchanged:

- Article load errors still display on page.
- Reader loading state still displays while article data is pending.
- Analysis progress and failure notices remain visible.
- Import validation for word count remains unchanged.

Visually, these states should use the same quiet bordered-message style used across the redesigned pages.

## Testing

Verification should include:

- Run existing frontend tests.
- Run frontend build.
- Manually inspect the main pages in the browser if the dev server can be started.
- Preserve or update tests only when structural JSX changes affect selectors while behavior remains the same.

Priority test-sensitive areas:

- Reader layout `data-testid` values.
- Reader token and sentence interactions.
- Import validation and submit state.
- Article list rendering.

## Implementation Notes

Prefer conservative, local edits:

- Keep class updates close to the components being styled.
- Reuse existing Tailwind classes and global `.reader-*` classes.
- Add shared CSS only when it reduces duplication or handles reader typography/annotation states better than repeated classes.
- Avoid unrelated refactors.

## Acceptance Criteria

- Core pages visually align with the `frontDesign` reference direction.
- Existing content and behavior remain intact.
- Login and Register are visually consistent with the new style.
- Existing frontend tests pass or are updated only to reflect non-behavioral structure changes.
- Frontend build succeeds.

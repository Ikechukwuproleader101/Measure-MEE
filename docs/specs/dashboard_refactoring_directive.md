# Directive: Clean Flat Dashboard Refactor (No Borders, No Gradients)

## Objective
Refactor all dashboard containers, cards, and icon layouts across the application. Remove all harsh borders, outlines, and gradient effects, replacing them with subtle elevation contrast, solid flat colors, and structured icon flex alignment based on modern flat UI principles.

---

## Design Principles to Enforce

1. **NO Heavy Outlines / Borders:**
   - Remove `border`, `border-gray-200`, `border-slate-300`, etc. from primary cards and containers.
   - Use soft background contrast (`bg-white` inside a `bg-slate-50` or `bg-zinc-100` page container) or light subtle ambient shadows (`shadow-sm` or `shadow-[0_2px_8px_rgba(0,0,0,0.04)]`) for visual depth.

2. **NO Gradients:**
   - Replace any `bg-gradient-to-*` classes with single, bold, solid colors (e.g., solid vibrant primary purple `#5E17EB` or `bg-primary`).
   - Use high-contrast flat white or dark text on solid colored cards.

3. **Consistent Icon Alignment & Enclosures:**
   - Place list/row icons inside fixed-size circular or rounded badges:
     ```html
     <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
       <!-- Icon SVG/Component -->
     </div>
     ```
   - Align item rows using `flex items-center gap-4` so text hierarchy remains aligned regardless of line height.

4. **Card Padding & Corner Radius:**
   - Use consistent large rounded corners (`rounded-2xl` or `rounded-3xl` depending on design tokens).
   - Use generous inner padding (`p-5` or `p-6`).

---

## Refactoring Instructions for Antigravity IDE

1. **Scan Dashboard Views:**
   - Find all dashboard layout components, summary cards, statistic blocks, and list items.

2. **Strip Outlines & Gradients:**
   - Search for and replace any occurrences of `border`, `border-2`, `bg-gradient-to-r`, or `bg-gradient-to-br`.
   - Set the page background wrapper to a neutral soft background (e.g., `bg-slate-50` / `dark:bg-zinc-950`).
   - Set interior cards to `bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border-none`.

3. **Standardize Action Cards:**
   - Convert primary hero cards (e.g., Total Balance) to a solid, flat background color with white text and rounded pill buttons (`rounded-full`).

4. **Verify Alignment:**
   - Ensure all list items (like transactions or rules) use horizontal flex layouts (`flex items-center justify-between`) with circular icon badges on the left.
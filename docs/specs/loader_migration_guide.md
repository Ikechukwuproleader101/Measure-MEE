# Directive: Standardize All App Loaders to Pill Spinner

## Objective
Scan the entire codebase and replace all existing loading indicators, spinners, and loading states with the standardized pill-shaped loader style defined below.

---

## Visual & Design Specification (Reference Image)
Based on the attached reference image (`image_4376eb.png`), the standardized loader must follow these exact design rules:

1. **Container Shape & Styling:**
   - **Shape:** Fully rounded pill (`rounded-full`).
   - **Background:** Neutral light gray background (`bg-gray-200` in Tailwind, or equivalent theme color).
   - **Dimensions/Padding:** Generous horizontal padding (`px-6 py-3` or similar responsive button sizing) so it resembles a pill-shaped button container.
   - **Shadow/Elevation:** Subtle shadow (`shadow-sm`) to lift it slightly from the dark background.

2. **Spinner Element:**
   - **Icon:** A circular spinner ring with a spinning animation (`animate-spin`).
   - **Border:** Thin dark border (`border-2 border-gray-600` or matching primary text color) with one side transparent (`border-t-transparent`) to create the classic loading arc effect.
   - **Placement:** Centered perfectly within the pill container.

---

## Implementation Steps for Antigravity IDE

1. **Create or Update a Shared Component:**
   - If not already present, create a reusable component (e.g., `PillLoader.jsx` or equivalent depending on your framework) implementing the design specifications above.

2. **Scan Codebase:**
   - Search across all files (React/Vue/HTML/Components) for terms like `spinner`, `loader`, `loading`, `animate-spin`, or custom SVG loaders.

3. **Replace & Refactor:**
   - Replace old standalone spinners or incorrect loading components with the new standardized pill loader component.
   - Ensure buttons or states that enter a loading condition switch to this pill container seamlessly without breaking layout alignment.
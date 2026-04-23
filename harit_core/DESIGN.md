# The Design System: Digital Stewardship & Precision

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Regenerative Canvas."** 

In the waste management sector, the goal is to transform chaos into order—to take discarded materials and regenerate value. This system reflects that journey through a "High-End Editorial" lens. We are moving away from the cluttered, "utility-only" look of traditional industrial SaaS. Instead, we embrace a sophisticated aesthetic that blends the technical precision of a Stripe-inspired interface with the organic, breathable clarity of a high-end publication.

By utilizing intentional asymmetry, overlapping layers, and high-contrast typography, we create an experience that feels less like a database and more like a curated command center. We don't just show data; we tell the story of a cleaner environment.

---

## 2. Colors & Surface Philosophy
Our palette is rooted in nature but refined by technology. We use a sophisticated range of greens and blues, supported by a deep gold for reward-based accents.

### The "No-Line" Rule
To achieve a premium, custom feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined through:
1.  **Background Color Shifts:** Use `surface-container-low` for page backgrounds and `surface-container-lowest` for cards.
2.  **Tonal Transitions:** A subtle shift from `surface` to `surface-container-high` provides a cleaner, more modern break than a hard line.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of frosted glass.
*   **Base:** `surface` (#f7f9fb)
*   **Sections:** `surface-container-low` (#f2f4f6)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Pop-overs/Modals:** `surface-bright` (#f7f9fb) with backdrop-blur.

### The "Glass & Gradient" Rule
Standard flat colors feel static. To provide "soul," use subtle gradients for high-impact areas:
*   **Primary CTAs:** A linear gradient from `primary` (#006b2c) to `primary_container` (#00873a).
*   **Data Accents:** Use a 10% opacity `surface_tint` over glassmorphic elements to anchor them to the background.

---

## 3. Typography
We utilize **Inter** for its neutral, highly legible characteristics. However, the hierarchy is intentionally dramatic to create an editorial feel.

*   **Display (Display-LG/MD):** Used for primary metrics (e.g., Total Carbon Offset). High weight, tight tracking (-0.02em).
*   **Headlines (Headline-SM):** Used for module titles. These are the anchors of your layout.
*   **Body (Body-MD):** Use for all primary reading. Maintain a line height of 1.6 for maximum breathability.
*   **Labels (Label-MD/SM):** These are our "Technical Metadata." Use `on-surface-variant` with 0.05em letter spacing to denote data points like "Last Updated" or "AI Confidence."

---

## 4. Elevation & Depth
We achieve depth through **Tonal Layering** rather than structural lines.

### The Layering Principle
Do not use shadows for every card. Instead, place a `surface-container-lowest` card on a `surface-container-low` background. This creates a "Natural Lift."

### Ambient Shadows
When a floating effect is required (e.g., a Sidebar or a floating Action Button):
*   **Shadow Specs:** 0px 10px 40px rgba(0, 0, 0, 0.04). 
*   **Shadow Tint:** The shadow color should be a tinted version of `on-surface` (#191c1e) at a very low opacity, mimicking natural light.

### The "Ghost Border" Fallback
If a border is required for accessibility, it must be a **Ghost Border**:
*   **Token:** `outline-variant` (#bdcaba) at 15% opacity.
*   **Constraint:** Never use 100% opaque borders.

---

## 5. Components

### High-Contrast CTAs
*   **Primary:** Gradient of `primary` to `primary_container`. Radius: `md` (0.75rem).
*   **Secondary:** `surface-container-highest` background with `on-surface` text. No border.

### Status Tags (Pending, Completed, Assigned)
Avoid the "pill" look that everyone else uses. 
*   **Style:** Rectangular with `sm` (0.25rem) radius.
*   **Coloring:** Use `secondary-fixed` for Assigned and `primary-fixed` for Completed. Text should be the `on-color-fixed-variant` for high contrast and readability.

### AI Confidence Progress Bars
*   **Visual:** A thin 4px track (`surface-container-highest`) with a glowing gradient fill.
*   **Detail:** Add a subtle `surface_tint` outer glow to the fill to make the "AI" element feel alive and active.

### Dashboard Sidebar
*   **Structure:** A fixed `surface-container-low` slab. 
*   **Active State:** The active menu item should not use a box; it should use a `primary` color vertical bar (4px) on the left and a weight shift in the typography.

### Data Cards
*   **Rule:** Forbid divider lines. Use `spacing-lg` (vertical whitespace) to separate content sections within the card.
*   **Radius:** Standardize on `lg` (1rem) to feel soft yet professional.

---

## 6. Do’s and Don'ts

### Do
*   **Do** use asymmetrical layouts (e.g., a wide 8-column data visualization next to a narrow 4-column "Insights" list).
*   **Do** use `surface-container-lowest` for elements that users can interact with.
*   **Do** prioritize "White Space as a Tool." If a layout feels crowded, remove a border and add 16px of padding instead.

### Don't
*   **Don't** use pure black (#000000) for text. Use `on-surface` (#191c1e) to maintain a premium, softer contrast.
*   **Don't** use standard "Drop Shadows." If the element doesn't feel like it's lifting off the page via color alone, use the Ambient Shadow spec.
*   **Don't** use more than three levels of nesting. If you need a card inside a card, use a subtle `surface-variant` background for the inner child.

---

*This design system is a living document. Use these principles to build an interface that feels like a premium tool for a better planet.*
# Parts Catalog Redesign Specification (TruckMod Pro)

**Effective Date**: 2025-07-04  
**Version**: 1.0  
**Maintainer**: Kevin Shelton  
**Developer Assigned**: Manus  
**Repository**: [client-shop-nexus](https://github.com/ksegis/client-shop-nexus)

---

## 🎯 Objective

Redesign the **Parts & Special Orders** catalog interface for truck customization clients to improve:

- Usability & navigation
- Visual clarity
- Grouping & filtering
- Search effectiveness

This must be done **without adding new APIs or changing the database model**.

---

## 🔧 Implementation Constraints

| Constraint                       | Requirement                                      |
|----------------------------------|--------------------------------------------------|
| 🔁 Backend Reuse                | Use existing Supabase DB integration             |
| 🧱 UI Component Reuse          | Modify existing `PartCard`, `SearchFilter`, etc. |
| 🚫 No New APIs                  | All queries must use current inventory table     |
| 🛠 Preserve Functionality       | Cart, pagination, search, sort must work         |

---

## 📐 Functional Enhancements

### 🔳 Tile Layout
Update `PartCard.vue` or equivalent to show:

- **Header**: Part name (bold), category badge (derived)
- **Details**: SKU, brand, margin, cost, price
- **Stock**: Qty + status badge (Low, In Stock, Region-specific)
- **Action**: Add to cart button

### 🧩 Category Grouping
Use frontend logic to infer `category` from `name`/`description`.  
Suggested pattern:

```ts
function categorizePart(name) {
  if (name.toLowerCase().includes("hose")) return "Hoses";
  if (name.toLowerCase().includes("pad")) return "Braking";
  if (name.toLowerCase().includes("kit")) return "Installation Kits";
  return "Uncategorized";
}

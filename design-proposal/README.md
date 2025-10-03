Copy these files into your repo. Summary:
- Adds a soft, modern color system using CSS variables
- Uses Inter for UI and Noto Sans SC for Chinese text
- Clean header, soft hero and card components with good spacing
- Accessible color contrast and bigger hit targets for mobile


Steps:
1. Add the font links into public/index.html (below).
2. Copy src/design/theme.css and import it near the root (e.g. index.tsx or App.tsx):
import './design/theme.css';
3. Copy the components into src/components/ and import them in your main App (or replace App.tsx with AppNew.tsx to preview).
4. Fine tune colors/spacing to fit your brand.

Optionally: create a PR branch `design/soft-ui` and commit these changes.

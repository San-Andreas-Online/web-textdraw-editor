// Font IDs match SA-MP TextDrawFont() values (0–4)
// Files live in src/resources/fonts/
//   diploma.ttf         → GTASANormal (font 0 Normal, font 1 Italic)
//   BankGothicMediumBT.ttf → GTASAClear (font 2 Clear Uppercase)
//   Pricedown_Bl.otf    → GTASABold   (font 3 Bold/Title)

export const FONTS = [
  { id: 0, name: 'Font 0',          family: 'GTASANormal' },
  { id: 1, name: 'Font 1',   family: 'GTASANormal2'},
  { id: 2, name: 'Font 2', family: 'GTASAClear' },
  { id: 3, name: 'Font 3',     family: 'GTASABold' },
]

export const FONT_NAMES = FONTS.map(f => f.name)



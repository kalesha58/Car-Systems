<!-- ce23c31b-6995-462c-a33f-983c54dc297e 3c85b5d3-5cda-4d8d-98a3-750630e1c3b3 -->
# Rotating Dashboard Animations Implementation

## Overview

Update the ProductDashboard Visuals component to show a different animation on each visit, rotating between three available animations: `raining.json`, `Sakura fall.json`, and `Christmas Sleigh.json`. All animations will use the same gray gradient background (`darkWeatherColors`) that's currently used for the raining effect. Add translation support for animation names in English, Hindi, and Telugu.

## Implementation Steps

### 1. Create Animation Configuration

- Create `client/src/utils/animationConfig.ts` to define available animations
- Export array of animation objects with their file paths
- Include: raining, sakura fall, and christmas sleigh animations
- Add translation key field for each animation name
- No gradient colors needed - all will use existing `darkWeatherColors`

### 2. Update Visuals Component

- Modify `client/src/features/dashboard/Visuals.tsx` to:
  - Use `useState` or `useMemo` to select a random animation on component mount
  - Get animation source from the selected animation config
  - Keep existing scroll-based opacity animation
  - Keep existing `darkWeatherColors` gradient for all animations (no changes)
  - Keep existing cloud image (same for all animations)
  - Use translation hook if animation names need to be displayed

### 3. Animation Selection Logic

- On component mount, randomly select one of the three animations
- Store selection in component state (not persisted, changes on each mount)
- Use the selected animation's JSON file path for LottieView source
- Background gradient remains constant (darkWeatherColors)

### 4. Add Translation Support

- Add animation translation keys to all locale files:
  - `client/src/locales/en/translations.json`
  - `client/src/locales/hi/translations.json`
  - `client/src/locales/te/translations.json`
- Add `animations` section with keys for each animation name
- Update animationConfig to include translation key references

## Files to Create

- `client/src/utils/animationConfig.ts` - Animation configuration with file paths and translation keys

## Files to Modify

- `client/src/features/dashboard/Visuals.tsx` - Add random animation selection logic
- `client/src/locales/en/translations.json` - Add animation translations
- `client/src/locales/hi/translations.json` - Add animation translations
- `client/src/locales/te/translations.json` - Add animation translations

## Implementation Details

### Animation Config Structure

```typescript
interface IAnimationConfig {
  id: string;
  source: any; // require() path
  translationKey: string; // Key for i18n translation
}

const animations: IAnimationConfig[] = [
  {
    id: 'rain',
    source: require('@assets/animations/raining.json'),
    translationKey: 'animations.rain',
  },
  {
    id: 'sakura',
    source: require('@assets/animations/Sakura fall.json'),
    translationKey: 'animations.sakuraFall',
  },
  {
    id: 'christmas',
    source: require('@assets/animations/Christmas Sleigh.json'),
    translationKey: 'animations.christmasSleigh',
  },
];
```

### Translation Keys Structure

Add to all locale files under `animations` section:

**English (en/translations.json):**
```json
{
  "animations": {
    "rain": "Rain",
    "sakuraFall": "Sakura Fall",
    "christmasSleigh": "Christmas Sleigh"
  }
}
```

**Hindi (hi/translations.json):**
```json
{
  "animations": {
    "rain": "बारिश",
    "sakuraFall": "सकुरा गिरना",
    "christmasSleigh": "क्रिसमस स्लेज"
  }
}
```

**Telugu (te/translations.json):**
```json
{
  "animations": {
    "rain": "వర్షం",
    "sakuraFall": "సకురా పతనం",
    "christmasSleigh": "క్రిస్మస్ స్లెడ్"
  }
}
```

### Visuals Component Changes

- Import animation config
- Use `useMemo` or `useState` with `useEffect` to select random animation on mount
- Replace hardcoded `raining.json` with selected animation source
- Keep existing `darkWeatherColors` gradient (no changes to gradient)
- Keep existing cloud image (no changes to cloud)
- Keep all existing styling and animation behavior
- Import `useTranslation` hook if animation names need to be displayed in future

### To-dos

- [x] Create animationConfig.ts with three animation definitions (rain, sakura, christmas)
- [x] Update Visuals.tsx to randomly select and use one of the three animations on each mount
- [x] Add translation keys for animations in en/translations.json
- [x] Add translation keys for animations in hi/translations.json
- [x] Add translation keys for animations in te/translations.json
- [x] Update animationConfig.ts to use translation keys instead of hardcoded names


# Motonode Architecture

React Native CLI app migrated from the Expo UI prototype (`Motonode-Product-Tracker/artifacts/mobile`).

## Principles

- **Feature-first screens** — grouped by role (`auth`, `customer`, `dealer`, `shared`)
- **Type-based components** — reusable UI under `components/` by type
- **Domain services** — mock data phase 1, API phase 2
- **Context + AsyncStorage** — no Zustand, Redux, or TanStack Query

## Folder Layout

```
src/
├── assets/          images, icons, fonts, animations
├── components/      reusable UI by type
├── data/            mockData.ts, dealerData.ts (phase 1)
├── navigation/      Root, Auth, Customer/Dealer stacks + tabs
├── screens/         feature screens by role
├── services/        API layer (mock-backed)
├── context/         Auth, Cart, Wishlist, Dealer providers
├── storage/         AsyncStorage helpers & keys
├── hooks/           useColors, etc.
├── utils/
├── constants/
├── types/
├── theme/
└── config/
```

## Navigation

```
RootNavigator
├── AuthNavigator (Onboarding, Login, Signup, OTP)
├── CustomerNavigator (Stack)
│   ├── CustomerTabs (Home, Marketplace, Garage, Community, Profile)
│   ├── Cart, Search, Notifications
│   ├── ProductDetail, VehicleDetail
│   └── AiAssistant (modal)
└── DealerNavigator (Stack)
    ├── DealerTabs (Dashboard, Inventory, Orders, Drive, Profile)
    ├── DealerType, BusinessRegistration
    └── ProductForm, VehicleForm, ServiceForm
```

## State Management

| Domain | Context | Storage key |
|--------|---------|-------------|
| Auth | `AuthContext` | `USER`, `ONBOARDED`, `AUTH_TOKEN` |
| Cart | `CartContext` | `CART` |
| Wishlist | `WishlistContext` | `WISHLIST` |
| Dealer | `DealerContext` | dealer keys in `storage/keys.ts` |

## Path Aliases

`@components`, `@screens`, `@navigation`, `@services`, `@storage`, `@context`, `@hooks`, `@utils`, `@constants`, `@theme`, `@config`, `@assets`, `@data`

## Tech Stack

- React Native CLI 0.86 + TypeScript
- React Navigation v7
- Axios (API client ready)
- AsyncStorage + React Context
- react-native-vector-icons (Feather)
- react-native-linear-gradient
- @shopify/flash-list
- react-native-haptic-feedback

## Theming (brand palette)

All UI colors flow from a single source:

| Layer | File | Purpose |
|-------|------|---------|
| Raw tokens | `src/theme/brand.ts` | Logo palette hex values only |
| Semantic palettes | `src/theme/colors.ts` | Light + dark mappings (`primary`, `background`, `textPrimary`, etc.) |
| Gradients | `src/theme/gradients.ts` | `LinearGradient` presets (`primary`, `header`, `dark`) |
| Runtime hook | `src/hooks/useColors.ts` | `const colors = useColors()` in components |

**Rules:**
- Do not add new hex colors in screens or components.
- Use `colors.primary`, `colors.textSecondary`, `colors.border`, etc. from `useColors()`.
- For static `StyleSheet.create`, use `themeLight` from `@theme/colors` (light-only) or inline styles with `useColors()`.
- Import `brand` only inside `src/theme/`.
- Info blue (`colors.info`) is for informational badges, not primary CTAs.

**Brand primary:** `#E60012` (Primary Red) with deep `#B0000F` for pressed states and gradients.

## Verification

```sh
npx tsc --noEmit
npm run lint
grep -r "expo" src/   # should return nothing
```

## Phase 2 (future)

- Replace mock services with live `api.motonode.in` calls
- Add Firebase, Razorpay, Maps, Socket.IO as needed

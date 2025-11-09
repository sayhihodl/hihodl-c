# Native Tab Bar Module

Native iOS Tab Bar module using Swift UITabBar following Apple's Human Interface Guidelines.

## Installation

This is a local Expo module. No installation needed - it's part of the project.

## Usage

```tsx
import { NativeTabBar } from '@/modules/native-tab-bar/src';

<NativeTabBar
  items={[
    { title: "Home", icon: "house.fill" },
    { title: "Swap", icon: "arrow.left.arrow.right" }
  ]}
  selectedIndex={0}
  onTabSelected={(index, item) => {
    // Handle tab selection
  }}
/>
```

## Development Build Required

**Important:** Native modules require a development build. You cannot test this in Expo Go.

To test:
```bash
npx expo prebuild
npx expo run:ios
```

## References

- [Apple HIG - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)







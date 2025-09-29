// global.d.ts
declare module '*.png' {
  const src: number; // así lo resuelve Metro
  export default src;
}

declare module '*.jpg' {
  const src: number;
  export default src;
}

declare module '*.jpeg' {
  const src: number;
  export default src;
}

declare module '*.svg' {
  import * as React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
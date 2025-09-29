// components/HiHodlPortalIcon.tsx
import * as React from 'react';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';

type Variant = 'cutout' | 'filled';

type Props = {
  size?: number;
  baseColor?: string;   // color del círculo base
  ringColor?: string;   // color de los aros (sólo en "filled")
  variant?: Variant;    // 'cutout' (unselected) | 'filled' (selected)
};

const RADII = [164, 140, 116, 92, 68, 44]; // concéntricos, estilo “puerta”

export default function HiHodlPortalIcon({
  size = 28,
  baseColor = '#FFFFFF',
  ringColor = '#FFB703',
  variant = 'cutout',
}: Props) {
  if (variant === 'cutout') {
    // Aros recortados (transparente) sobre base sólida
    return (
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <Mask id="hole">
            <Rect width="512" height="512" fill="white" />
            {RADII.map((r) => (
              <Circle key={r} cx="256" cy="256" r={r} fill="black" />
            ))}
          </Mask>
        </Defs>
        <Circle cx="256" cy="256" r="232" fill={baseColor} mask="url(#hole)" />
      </Svg>
    );
  }

  // variant === 'filled' → base + aros pintados
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Circle cx="256" cy="256" r="232" fill={baseColor} />
      {RADII.map((r) => (
        <Circle key={r} cx="256" cy="256" r={r} fill={ringColor} />
      ))}
    </Svg>
  );
}
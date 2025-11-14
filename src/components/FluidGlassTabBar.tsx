// src/components/FluidGlassTabBar.tsx
// FluidGlass TabBar usando Three.js (experimental - puede afectar rendimiento)
// Si no funciona bien, usar NativeIOSTabBar.tsx en su lugar

import React, { Suspense } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useGLTF, Environment, PerspectiveCamera } from '@react-three/drei/native';
import * as THREE from 'three';

// NOTA: Este componente requiere:
// 1. npm install three @react-three/fiber @react-three/drei maath expo-gl expo-three
// 2. Modelos 3D en assets/3d/ (lens.glb, bar.glb, cube.glb)
// 3. Puede afectar el rendimiento en dispositivos móviles

interface FluidGlassProps {
  mode?: 'lens' | 'bar' | 'cube';
  lensProps?: {
    scale?: number;
    ior?: number;
    thickness?: number;
    chromaticAberration?: number;
    anisotropy?: number;
  };
  barProps?: Record<string, any>;
  cubeProps?: Record<string, any>;
}

function LensModel({ props }: { props: FluidGlassProps['lensProps'] }) {
  // Cargar modelo GLB
  const { scene } = useGLTF(require('@/assets/3d/lens.glb'));
  
  return (
    <primitive
      object={scene}
      scale={props?.scale || 0.25}
      position={[0, 0, 0]}
    />
  );
}

function BarModel({ props }: { props: FluidGlassProps['barProps'] }) {
  const { scene } = useGLTF(require('@/assets/3d/bar.glb'));
  return <primitive object={scene} />;
}

function CubeModel({ props }: { props: FluidGlassProps['cubeProps'] }) {
  const { scene } = useGLTF(require('@/assets/3d/cube.glb'));
  return <primitive object={scene} />;
}

function FluidGlass({ mode = 'lens', lensProps, barProps, cubeProps }: FluidGlassProps) {
  const ModelComponent = 
    mode === 'lens' ? LensModel :
    mode === 'bar' ? BarModel :
    CubeModel;

  const modelProps = 
    mode === 'lens' ? lensProps :
    mode === 'bar' ? barProps :
    cubeProps;

  return (
    <Canvas
      style={StyleSheet.absoluteFill}
      gl={{ antialias: true, alpha: true }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Environment preset="sunset" />
      <Suspense fallback={null}>
        <ModelComponent props={modelProps} />
      </Suspense>
    </Canvas>
  );
}

// Wrapper para el TabBar
export default function FluidGlassTabBar({ children, ...props }: any) {
  // Solo en iOS/Android, no en web
  if (Platform.OS === 'web') {
    return children;
  }

  return (
    <View style={styles.container}>
      <View style={styles.glassContainer}>
        <FluidGlass
          mode="lens"
          lensProps={{
            scale: 0.25,
            ior: 1.15,
            thickness: 5,
            chromaticAberration: 0.1,
            anisotropy: 0.01,
          }}
        />
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  glassContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3, // Ajustar opacidad para que no tape el contenido
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});




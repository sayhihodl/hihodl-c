// types/optional-modules.d.ts
declare module "expo-barcode-scanner" {
  // Exporta 'any' para que TS no proteste cuando el paquete no esté instalado
  const mod: any;
  export default mod;
  export const BarCodeScanner: any;
}
declare module "expo-camera" {
  const mod: any;
  export default mod;
}
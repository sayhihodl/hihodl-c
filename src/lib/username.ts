// src/lib/username.ts
export const isValidUsername = (v:string)=> v.length>=3 && !/[^a-z0-9_.-]/i.test(v);
export async function checkUsernameAvailability(v:string){
  await new Promise(r=>setTimeout(r,400));
  // marca algunos como “no disponible” para probar
  return !['admin','helloalex','test', 'solana', 'ethereum', 'bitcoin', 'HUSD', 'HODL', 'HIHODL'].includes(v.toLowerCase());
}
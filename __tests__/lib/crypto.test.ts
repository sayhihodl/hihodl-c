/**
 * Tests for cryptographic utilities
 * These are CRITICAL - vault security depends on this
 */
import {
  scryptKey,
  hkdfAesKey,
  aesGcmEncrypt,
  aesGcmDecrypt,
  DEFAULT_SCRYPT,
} from '../../src/lib/crypto';

describe('Crypto Utilities', () => {
  describe('scryptKey', () => {
    it('should derive a 32-byte key from passphrase', async () => {
      const passphrase = 'test-passphrase-123';
      const salt = new Uint8Array(16).fill(1);
      
      const key = await scryptKey(passphrase, salt, DEFAULT_SCRYPT);
      
      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
      expect(key).not.toEqual(new Uint8Array(32).fill(0));
    });

    it('should produce same key for same input', async () => {
      const passphrase = 'consistent-test';
      const salt = new Uint8Array(16).fill(2);
      
      const key1 = await scryptKey(passphrase, salt, DEFAULT_SCRYPT);
      const key2 = await scryptKey(passphrase, salt, DEFAULT_SCRYPT);
      
      expect(key1).toEqual(key2);
    });

    it('should produce different keys for different salts', async () => {
      const passphrase = 'same-passphrase';
      const salt1 = new Uint8Array(16).fill(3);
      const salt2 = new Uint8Array(16).fill(4);
      
      const key1 = await scryptKey(passphrase, salt1, DEFAULT_SCRYPT);
      const key2 = await scryptKey(passphrase, salt2, DEFAULT_SCRYPT);
      
      expect(key1).not.toEqual(key2);
    });

    it('should produce different keys for different passphrases', async () => {
      const salt = new Uint8Array(16).fill(5);
      
      const key1 = await scryptKey('pass1', salt, DEFAULT_SCRYPT);
      const key2 = await scryptKey('pass2', salt, DEFAULT_SCRYPT);
      
      expect(key1).not.toEqual(key2);
    });
  });

  describe('hkdfAesKey', () => {
    it('should derive AES-GCM key from IKM', async () => {
      const ikm = new Uint8Array(32).fill(10);
      const pepper = new Uint8Array(32).fill(20);
      
      const key = await hkdfAesKey(ikm, pepper);
      
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.algorithm.name).toBe('AES-GCM');
      expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
    });

    it('should produce different keys for different pepper', async () => {
      const ikm = new Uint8Array(32).fill(15);
      const pepper1 = new Uint8Array(32).fill(25);
      const pepper2 = new Uint8Array(32).fill(26);
      
      const key1 = await hkdfAesKey(ikm, pepper1);
      const key2 = await hkdfAesKey(ikm, pepper2);
      
      // Keys should be different (can't directly compare CryptoKey objects)
      // But we can test encryption produces different ciphertexts
      const data = new Uint8Array([1, 2, 3, 4]);
      const enc1 = await aesGcmEncrypt(key1, data);
      const enc2 = await aesGcmEncrypt(key2, data);
      
      expect(enc1.ct).not.toEqual(enc2.ct);
    });
  });

  describe('aesGcmEncrypt / aesGcmDecrypt', () => {
    it('should encrypt and decrypt correctly', async () => {
      // Derive key
      const passphrase = 'encryption-test';
      const salt = new Uint8Array(16).fill(30);
      const pepper = new Uint8Array(32).fill(40);
      
      const scryptKey_ = await scryptKey(passphrase, salt, DEFAULT_SCRYPT);
      const aesKey = await hkdfAesKey(scryptKey_, pepper);
      
      // Encrypt
      const plaintext = new TextEncoder().encode('secret mnemonic phrase');
      const { iv, ct } = await aesGcmEncrypt(aesKey, plaintext);
      
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12); // GCM standard IV size
      expect(ct).toBeInstanceOf(Uint8Array);
      expect(ct.length).toBeGreaterThan(0);
      
      // Decrypt
      const decrypted = await aesGcmDecrypt(aesKey, iv, ct);
      const decryptedText = new TextDecoder().decode(decrypted);
      
      expect(decryptedText).toBe('secret mnemonic phrase');
    });

    it('should produce different ciphertexts for same plaintext (IV randomness)', async () => {
      const passphrase = 'randomness-test';
      const salt = new Uint8Array(16).fill(35);
      const pepper = new Uint8Array(32).fill(45);
      
      const scryptKey_ = await scryptKey(passphrase, salt, DEFAULT_SCRYPT);
      const aesKey = await hkdfAesKey(scryptKey_, pepper);
      
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      
      const enc1 = await aesGcmEncrypt(aesKey, plaintext);
      const enc2 = await aesGcmEncrypt(aesKey, plaintext);
      
      // IVs should be different (random)
      expect(enc1.iv).not.toEqual(enc2.iv);
      // Ciphertexts should be different
      expect(enc1.ct).not.toEqual(enc2.ct);
      
      // But both should decrypt to same plaintext
      const dec1 = await aesGcmDecrypt(aesKey, enc1.iv, enc1.ct);
      const dec2 = await aesGcmDecrypt(aesKey, enc2.iv, enc2.ct);
      
      expect(dec1).toEqual(plaintext);
      expect(dec2).toEqual(plaintext);
    });

    it('should fail to decrypt with wrong key', async () => {
      const passphrase = 'wrong-key-test';
      const salt = new Uint8Array(16).fill(40);
      const pepper1 = new Uint8Array(32).fill(50);
      const pepper2 = new Uint8Array(32).fill(51); // Different pepper = different key
      
      const scryptKey1 = await scryptKey(passphrase, salt, DEFAULT_SCRYPT);
      const scryptKey2 = await scryptKey(passphrase, salt, DEFAULT_SCRYPT);
      
      const key1 = await hkdfAesKey(scryptKey1, pepper1);
      const key2 = await hkdfAesKey(scryptKey2, pepper2);
      
      const plaintext = new Uint8Array([10, 20, 30]);
      const { iv, ct } = await aesGcmEncrypt(key1, plaintext);
      
      // Decrypting with wrong key should throw
      await expect(aesGcmDecrypt(key2, iv, ct)).rejects.toThrow();
    });

    it('should fail to decrypt with wrong IV', async () => {
      const passphrase = 'wrong-iv-test';
      const salt = new Uint8Array(16).fill(45);
      const pepper = new Uint8Array(32).fill(55);
      
      const scryptKey_ = await scryptKey(passphrase, salt, DEFAULT_SCRYPT);
      const aesKey = await hkdfAesKey(scryptKey_, pepper);
      
      const plaintext = new Uint8Array([15, 25, 35]);
      const { iv, ct } = await aesGcmEncrypt(aesKey, plaintext);
      
      // Create wrong IV
      const wrongIv = new Uint8Array(12).fill(99);
      
      // Decrypting with wrong IV should throw
      await expect(aesGcmDecrypt(aesKey, wrongIv, ct)).rejects.toThrow();
    });
  });

  describe('Integration: Full encryption flow', () => {
    it('should encrypt and decrypt mnemonic correctly', async () => {
      const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      const passphrase = 'user-passphrase-123';
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const pepper = crypto.getRandomValues(new Uint8Array(32));
      
      // Encrypt
      const scryptKey_ = await scryptKey(passphrase, salt, DEFAULT_SCRYPT);
      const aesKey = await hkdfAesKey(scryptKey_, pepper);
      const plaintext = new TextEncoder().encode(mnemonic);
      const { iv, ct } = await aesGcmEncrypt(aesKey, plaintext);
      
      // Decrypt
      const decryptedBytes = await aesGcmDecrypt(aesKey, iv, ct);
      const decryptedMnemonic = new TextDecoder().decode(decryptedBytes);
      
      expect(decryptedMnemonic).toBe(mnemonic);
      expect(decryptedBytes).not.toBe(plaintext); // Different object reference but same content
    });
  });
});


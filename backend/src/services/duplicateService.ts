import crypto from 'crypto';
import sharp from 'sharp';
import { prisma } from '../config/db';
import { ExtractedReceiptData } from './aiService';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matchType?: 'EXACT_HASH' | 'PERCEPTUAL_HASH' | 'FISCAL_FOLIO' | 'SIMILAR_CONTENT';
  similarityPercentage: number;
  candidateReceiptId?: string;
  candidateTransactionId?: string;
  reason?: string;
}

export class DuplicateService {
  /**
   * Calcula el hash criptográfico SHA-256 del archivo
   */
  calculateSha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Calcula un hash perceptual simple de 64-bits (dHash) usando sharp
   * Redimensiona a 9x8 en escala de grises y compara diferencias de píxeles adyacentes
   */
  async calculatePerceptualHash(buffer: Buffer): Promise<string> {
    try {
      const { data } = await sharp(buffer)
        .grayscale()
        .resize(9, 8, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      let hash = '';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const left = data[row * 9 + col];
          const right = data[row * 9 + col + 1];
          hash += left > right ? '1' : '0';
        }
      }
      // Convertir 64 bits binarios a hexadecimal (16 caracteres)
      let hexHash = '';
      for (let i = 0; i < hash.length; i += 4) {
        const nibble = hash.substring(i, i + 4);
        hexHash += parseInt(nibble, 2).toString(16);
      }
      return hexHash;
    } catch (e) {
      console.warn('No se pudo calcular pHash:', e);
      return '';
    }
  }

  /**
   * Calcula la distancia de Hamming entre dos hashes perceptuales
   */
  hammingDistance(hash1: string, hash2: string): number {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
    let dist = 0;
    for (let i = 0; i < hash1.length; i++) {
      const n1 = parseInt(hash1[i], 16);
      const n2 = parseInt(hash2[i], 16);
      let xor = n1 ^ n2;
      while (xor > 0) {
        dist += xor & 1;
        xor >>= 1;
      }
    }
    return dist;
  }

  /**
   * Ejecuta la detección multinivel de comprobantes duplicados
   */
  async checkDuplicate(
    userId: string,
    fileSha256: string,
    imagePhash: string,
    extractedData: ExtractedReceiptData
  ): Promise<DuplicateDetectionResult> {
    // 1. Nivel 1: SHA-256 Exacto de archivo
    const exactReceipt = await prisma.receipt.findFirst({
      where: {
        userId,
        fileSha256,
        status: { not: 'REJECTED' },
      },
      include: { transaction: true },
    });

    if (exactReceipt) {
      return {
        isDuplicate: true,
        matchType: 'EXACT_HASH',
        similarityPercentage: 100,
        candidateReceiptId: exactReceipt.id,
        candidateTransactionId: exactReceipt.transaction?.id,
        reason: 'Esta imagen es exactamente idéntica a un comprobante ya registrado en el sistema.',
      };
    }

    // 2. Nivel 2: Hash Perceptual (misma foto con compresión, recorte leve o diferente resolución)
    if (imagePhash) {
      const existingReceipts = await prisma.receipt.findMany({
        where: {
          userId,
          imagePhash: { not: null },
          status: { not: 'REJECTED' },
        },
        include: { transaction: true },
        take: 100,
        orderBy: { createdAt: 'desc' },
      });

      for (const rec of existingReceipts) {
        if (rec.imagePhash) {
          const dist = this.hammingDistance(imagePhash, rec.imagePhash);
          if (dist <= 6) {
            const similarity = Math.round(((64 - dist) / 64) * 100);
            return {
              isDuplicate: true,
              matchType: 'PERCEPTUAL_HASH',
              similarityPercentage: similarity,
              candidateReceiptId: rec.id,
              candidateTransactionId: rec.transaction?.id,
              reason: `La fotografía tiene una similitud visual del ${similarity}% con otro comprobante registrado.`,
            };
          }
        }
      }
    }

    // 3. Nivel 3: Coincidencia de Datos Fiscales y Folio
    if (extractedData.ticket_number && extractedData.date && extractedData.total > 0) {
      const matchFolio = await prisma.transaction.findFirst({
        where: {
          userId,
          ticketNumber: extractedData.ticket_number,
          total: extractedData.total,
        },
        include: { receipt: true },
      });

      if (matchFolio) {
        return {
          isDuplicate: true,
          matchType: 'FISCAL_FOLIO',
          similarityPercentage: 99,
          candidateReceiptId: matchFolio.receiptId || undefined,
          candidateTransactionId: matchFolio.id,
          reason: `Existe un gasto registrado con el mismo número de ticket/folio (${extractedData.ticket_number}) y mismo total ($${extractedData.total.toFixed(2)}).`,
        };
      }
    }

    // 4. Nivel 4: Mismo día, mismo total y misma tienda (posible foto tomada desde otro ángulo)
    const transactionDate = new Date(extractedData.date);
    if (!isNaN(transactionDate.getTime()) && extractedData.total > 0) {
      const startOfDay = new Date(transactionDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(transactionDate);
      endOfDay.setHours(23, 59, 59, 999);

      const candidateTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfDay, lte: endOfDay },
          total: {
            gte: extractedData.total - 0.05,
            lte: extractedData.total + 0.05,
          },
        },
        include: { receipt: true, store: true, items: true },
      });

      for (const cand of candidateTransactions) {
        // Verificar si la tienda coincide o si coinciden productos
        const storeMatches =
          cand.store &&
          extractedData.store_name &&
          (cand.store.name.toLowerCase().includes(extractedData.store_name.toLowerCase()) ||
            extractedData.store_name.toLowerCase().includes(cand.store.name.toLowerCase()));

        if (storeMatches) {
          return {
            isDuplicate: true,
            matchType: 'SIMILAR_CONTENT',
            similarityPercentage: 90,
            candidateReceiptId: cand.receiptId || undefined,
            candidateTransactionId: cand.id,
            reason: `Se detectó una compra en '${cand.store?.name}' en la misma fecha (${extractedData.date}) por exactamente $${extractedData.total.toFixed(2)}.`,
          };
        }
      }
    }

    return {
      isDuplicate: false,
      similarityPercentage: 0,
    };
  }
}

export const duplicateService = new DuplicateService();

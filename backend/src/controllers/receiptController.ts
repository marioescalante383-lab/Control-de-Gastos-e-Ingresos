import { Response } from 'express';
import fs from 'fs';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth';
import { aiService } from '../services/aiService';
import { duplicateService } from '../services/duplicateService';
import { normalizationService } from '../services/normalizationService';
import { inventoryService } from '../services/inventoryService';

export class ReceiptController {
  async uploadAndProcess(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No se subió ningún archivo de comprobante.' });
        return;
      }

      const fileBuffer = fs.readFileSync(file.path);
      const fileSha256 = duplicateService.calculateSha256(fileBuffer);
      const imagePhash = await duplicateService.calculatePerceptualHash(fileBuffer);

      // 1. Procesamiento multimodal de IA con Gemini
      const extractedData = await aiService.processReceiptImage(fileBuffer, file.mimetype);

      // 2. Detección inteligente de comprobantes duplicados
      const duplicateCheck = await duplicateService.checkDuplicate(
        userId,
        fileSha256,
        imagePhash,
        extractedData
      );

      // 3. Normalización y reglas de categorización previas
      const defaultCategory = await prisma.category.findFirst({
        where: { name: 'Alimentos' },
      });

      for (const item of extractedData.items) {
        // Verificar si existe una regla personalizada del usuario
        const matchedCatId = await normalizationService.applyUserRules(
          userId,
          item.raw_description,
          extractedData.store_name,
          item.normalized_name
        );

        if (matchedCatId) {
          const ruleCat = await prisma.category.findUnique({ where: { id: matchedCatId } });
          if (ruleCat) {
            item.suggested_category = ruleCat.name;
          }
        } else {
          // Verificar si el usuario ya le había enseñado este producto anteriormente
          const learned = await normalizationService.findMatchingProduct(userId, item.raw_description);
          if (learned) {
            const learnedCat = await prisma.category.findUnique({ where: { id: learned.categoryId } });
            if (learnedCat) {
              item.suggested_category = learnedCat.name;
              item.normalized_name = learned.productName;
              item.confidence = 99; // Alta confianza porque el usuario ya lo enseñó
            }
          }
        }
      }

      // 4. Guardar registro del Comprobante
      const receipt = await prisma.receipt.create({
        data: {
          userId,
          localFilename: file.filename,
          fileSha256,
          imagePhash,
          mimeType: file.mimetype,
          fileSize: file.size,
          status: duplicateCheck.isDuplicate ? 'DUPLICATE_FLAGGED' : 'OCR_READY',
          rawAiPayload: JSON.stringify(extractedData),
          confidenceOverall: extractedData.overall_confidence,
        },
      });

      // 5. Si es duplicado, registrar el DuplicateMatch
      let duplicateMatch = null;
      if (duplicateCheck.isDuplicate) {
        duplicateMatch = await prisma.duplicateMatch.create({
          data: {
            receiptId: receipt.id,
            candidateReceiptId: duplicateCheck.candidateReceiptId || null,
            candidateTransactionId: duplicateCheck.candidateTransactionId || null,
            matchType: duplicateCheck.matchType || 'SIMILAR_CONTENT',
            similarityPercentage: duplicateCheck.similarityPercentage,
            userResolution: 'PENDING',
          },
          include: {
            candidateReceipt: true,
            candidateTransaction: {
              include: { store: true, items: true },
            },
          },
        });
      }

      res.status(201).json({
        receiptId: receipt.id,
        status: receipt.status,
        extractedData,
        duplicateWarning: duplicateCheck.isDuplicate
          ? {
              reason: duplicateCheck.reason,
              matchType: duplicateCheck.matchType,
              similarityPercentage: duplicateCheck.similarityPercentage,
              matchDetails: duplicateMatch,
            }
          : null,
      });
    } catch (err: any) {
      console.error('Error al procesar comprobante:', err);
      res.status(500).json({ error: 'Error procesando el comprobante: ' + err.message });
    }
  }

  async getReceipt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const receipt = await prisma.receipt.findUnique({
        where: { id },
        include: {
          duplicateMatches: {
            include: {
              candidateReceipt: true,
              candidateTransaction: { include: { store: true, items: true } },
            },
          },
        },
      });

      if (!receipt || receipt.userId !== userId) {
        res.status(404).json({ error: 'Comprobante no encontrado' });
        return;
      }

      const parsedData = receipt.rawAiPayload ? JSON.parse(receipt.rawAiPayload) : null;

      res.json({
        receipt,
        parsedData,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar comprobante' });
    }
  }

  async confirmReceipt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const {
        storeName,
        rfc,
        date,
        time,
        ticketNumber,
        paymentMethod,
        currency,
        subtotal,
        discount,
        tax,
        total,
        notes,
        items, // Lista revisada y corregida por el usuario
      } = req.body;

      const receipt = await prisma.receipt.findUnique({ where: { id } });
      if (!receipt || receipt.userId !== userId) {
        res.status(404).json({ error: 'Comprobante no encontrado' });
        return;
      }

      // 1. Manejar o crear Comercio (Store)
      let store = null;
      if (storeName) {
        const normalizedStoreName = normalizationService.cleanText(storeName);
        store = await prisma.store.findFirst({
          where: { userId, normalizedName: normalizedStoreName },
        });

        if (!store) {
          store = await prisma.store.create({
            data: {
              userId,
              name: storeName,
              normalizedName: normalizedStoreName,
              rfc: rfc || null,
            },
          });
        }
      }

      // 2. Crear la Transacción financiera formal
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          receiptId: receipt.id,
          storeId: store?.id || null,
          date: new Date(date || Date.now()),
          time: time || null,
          ticketNumber: ticketNumber || null,
          paymentMethod: paymentMethod || 'CASH',
          currency: currency || 'MXN',
          subtotal: Number(subtotal) || Number(total) || 0,
          discount: Number(discount) || 0,
          tax: Number(tax) || 0,
          total: Number(total) || 0,
          isManual: false,
          notes: notes || null,
        },
      });

      // 3. Crear los ítems de la transacción
      const stockItemsToProcess = [];

      for (const it of items) {
        // Encontrar categoría
        let category = await prisma.category.findFirst({
          where: {
            OR: [
              { id: it.categoryId },
              { name: it.categoryName, OR: [{ userId }, { isSystem: true }] },
            ],
          },
        });

        if (!category) {
          category = await prisma.category.findFirst({
            where: { isSystem: true, name: 'Alimentos' },
          });
        }

        const normName = normalizationService.cleanText(it.normalizedName || it.rawDescription);

        // Buscar o crear el Producto en el catálogo del usuario
        let product = await prisma.product.findFirst({
          where: { userId, normalizedName: normName },
        });

        if (!product) {
          product = await prisma.product.create({
            data: {
              userId,
              categoryId: category!.id,
              name: it.normalizedName || it.rawDescription,
              normalizedName: normName,
              unitOfMeasure: it.unitOfMeasure || 'PZA',
              lastPricePaid: Number(it.unitPrice) || 0,
              defaultStoreId: store?.id || null,
              affectsInventory: it.affectsInventory !== false,
              minStock: 1,
              desiredStock: 2,
            },
          });
        }

        // Crear TransactionItem
        const txItem = await prisma.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: product.id,
            categoryId: category!.id,
            rawDescription: it.rawDescription,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            discount: Number(it.discount) || 0,
            tax: Number(it.tax) || 0,
            totalPrice: Number(it.totalPrice) || (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
            confidenceScore: Number(it.confidenceScore) || 1.0,
            affectsInventory: it.affectsInventory !== false,
          },
        });

        // Memorizar el alias para aprender de la corrección del usuario
        await normalizationService.rememberAlias(product.id, it.rawDescription, store?.id);

        if (it.affectsInventory !== false) {
          stockItemsToProcess.push({
            productId: product.id,
            name: product.name,
            categoryId: category!.id,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            affectsInventory: true,
            storeId: store?.id,
            transactionItemId: txItem.id,
          });
        }
      }

      // 4. Actualizar inventario, kárdex e historial de precios
      if (stockItemsToProcess.length > 0) {
        await inventoryService.processPurchaseItems(
          userId,
          stockItemsToProcess,
          transaction.date,
          transaction.id
        );
      }

      // 5. Marcar comprobante como validado
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: 'VALIDATED' },
      });

      // 6. Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'TRANSACTION',
          entityId: transaction.id,
          afterState: JSON.stringify({ transactionId: transaction.id, total: transaction.total }),
        },
      });

      res.status(201).json({
        message: 'Comprobante y compra confirmados exitosamente.',
        transactionId: transaction.id,
      });
    } catch (err: any) {
      console.error('Error al confirmar comprobante:', err);
      res.status(500).json({ error: 'Error al confirmar comprobante: ' + err.message });
    }
  }

  async dismissDuplicate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const receipt = await prisma.receipt.findUnique({ where: { id } });
      if (!receipt || receipt.userId !== userId) {
        res.status(404).json({ error: 'Comprobante no encontrado' });
        return;
      }

      await prisma.receipt.update({
        where: { id },
        data: { status: 'OCR_READY' },
      });

      await prisma.duplicateMatch.updateMany({
        where: { receiptId: id },
        data: { userResolution: 'DISMISSED' },
      });

      res.json({ message: 'Advertencia descartada. Puedes proceder a revisar el comprobante.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al descartar advertencia de duplicado' });
    }
  }
}

export const receiptController = new ReceiptController();

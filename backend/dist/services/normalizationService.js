"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizationService = exports.NormalizationService = void 0;
const db_1 = require("../config/db");
class NormalizationService {
    /**
     * Limpia y normaliza texto: minúsculas, sin acentos, sin puntuación redundante
     */
    cleanText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^a-z0-9\s]/g, ' ') // Quitar caracteres especiales
            .replace(/\s+/g, ' ')
            .trim();
    }
    /**
     * Calcula la distancia de Levenshtein entre dos cadenas para similitud difusa
     */
    levenshteinDistance(a, b) {
        const an = a ? a.length : 0;
        const bn = b ? b.length : 0;
        if (an === 0)
            return bn;
        if (bn === 0)
            return an;
        const matrix = [];
        for (let i = 0; i <= bn; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= an; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= bn; i++) {
            for (let j = 1; j <= an; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // sustitución
                    matrix[i][j - 1] + 1, // inserción
                    matrix[i - 1][j] + 1 // eliminación
                    );
                }
            }
        }
        return matrix[bn][an];
    }
    /**
     * Porcentaje de similitud entre 0% y 100%
     */
    calculateSimilarity(str1, str2) {
        const s1 = this.cleanText(str1);
        const s2 = this.cleanText(str2);
        if (s1 === s2)
            return 100;
        const maxLen = Math.max(s1.length, s2.length);
        if (maxLen === 0)
            return 100;
        const dist = this.levenshteinDistance(s1, s2);
        return Math.round((1 - dist / maxLen) * 100);
    }
    /**
     * Busca si un texto de ticket ya fue aprendido anteriormente por el usuario
     */
    async findMatchingProduct(userId, rawText, storeId) {
        const cleanedRaw = this.cleanText(rawText);
        // 1. Coincidencia exacta en ProductAlias del usuario
        const exactAlias = await db_1.prisma.productAlias.findFirst({
            where: {
                product: { userId },
                rawText: cleanedRaw,
                ...(storeId ? { storeId } : {}),
            },
            include: { product: true },
        });
        if (exactAlias) {
            return {
                productId: exactAlias.productId,
                productName: exactAlias.product.name,
                categoryId: exactAlias.product.categoryId,
                confidence: 100,
            };
        }
        // 2. Coincidencia exacta con nombre formal de producto existente
        const exactProduct = await db_1.prisma.product.findFirst({
            where: {
                userId,
                normalizedName: cleanedRaw,
            },
        });
        if (exactProduct) {
            return {
                productId: exactProduct.id,
                productName: exactProduct.name,
                categoryId: exactProduct.categoryId,
                confidence: 98,
            };
        }
        // 3. Similitud difusa con productos existentes del usuario
        const allProducts = await db_1.prisma.product.findMany({
            where: { userId },
            select: { id: true, name: true, normalizedName: true, categoryId: true },
        });
        let bestMatch = null;
        let highestSim = 0;
        for (const p of allProducts) {
            const sim = this.calculateSimilarity(cleanedRaw, p.normalizedName);
            if (sim > 75 && sim > highestSim) {
                highestSim = sim;
                bestMatch = {
                    productId: p.id,
                    productName: p.name,
                    categoryId: p.categoryId,
                    confidence: sim,
                };
            }
        }
        return bestMatch;
    }
    /**
     * Memoriza una asociación entre el texto crudo del ticket y el producto maestro
     */
    async rememberAlias(productId, rawText, storeId) {
        const cleanedRaw = this.cleanText(rawText);
        if (!cleanedRaw || cleanedRaw.length < 2)
            return;
        const existing = await db_1.prisma.productAlias.findFirst({
            where: {
                productId,
                rawText: cleanedRaw,
                storeId: storeId || null,
            },
        });
        if (existing) {
            await db_1.prisma.productAlias.update({
                where: { id: existing.id },
                data: { timesUsed: { increment: 1 } },
            });
        }
        else {
            await db_1.prisma.productAlias.create({
                data: {
                    productId,
                    rawText: cleanedRaw,
                    storeId: storeId || null,
                    confidenceScore: 1.0,
                    timesUsed: 1,
                },
            });
        }
    }
    /**
     * Evalúa las reglas de clasificación configuradas por el usuario
     */
    async applyUserRules(userId, rawText, storeName, productName) {
        const rules = await db_1.prisma.categorizationRule.findMany({
            where: { userId },
            orderBy: { priority: 'desc' },
        });
        for (const rule of rules) {
            const keyword = this.cleanText(rule.matchKeyword);
            if (!keyword)
                continue;
            let targetText = '';
            if (rule.matchField === 'RAW_DESCRIPTION')
                targetText = this.cleanText(rawText);
            else if (rule.matchField === 'STORE_NAME' && storeName)
                targetText = this.cleanText(storeName);
            else if (rule.matchField === 'PRODUCT_NAME' && productName)
                targetText = this.cleanText(productName);
            if (targetText.includes(keyword)) {
                return rule.targetCategoryId;
            }
        }
        return null;
    }
}
exports.NormalizationService = NormalizationService;
exports.normalizationService = new NormalizationService();

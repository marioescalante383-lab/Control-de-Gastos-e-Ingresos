import { GoogleGenAI, Type } from "@google/genai";
import { Item } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

interface ParsedReceipt {
  store: string;
  date: string;
  items: Item[];
}

export const analyzeReceipt = async (imageFile: File): Promise<ParsedReceipt> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          parts: [
            imagePart,
            { text: "Analiza este recibo y extrae el nombre de la tienda, la fecha de la compra y una lista de todos los artículos con su descripción (nombre), cantidad, precio unitario y el precio total por artículo. Asegúrate de que los precios y cantidades sean números. Si no puedes determinar la cantidad de un artículo, asume que es 1. Si el total por artículo no está explícitamente en el recibo, calcúlalo multiplicando la cantidad por el precio unitario." },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            store: { type: Type.STRING, description: "Nombre del establecimiento o tienda." },
            date: { type: Type.STRING, description: "Fecha de la compra en formato AAAA-MM-DD." },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Descripción o nombre del producto o artículo." },
                  quantity: { type: Type.INTEGER, description: "Cantidad del artículo comprado." },
                  price: { type: Type.NUMBER, description: "Precio unitario del artículo." },
                  total: { type: Type.NUMBER, description: "Precio total para la línea de este artículo. Si no está explícito, calcúlalo (cantidad * precio unitario)." },
                },
                required: ["name", "quantity", "price", "total"],
              },
            },
          },
          required: ["store", "date", "items"],
        },
      },
    });

    const parsedResponse = JSON.parse(response.text) as Omit<ParsedReceipt, 'items'> & { items: Omit<Item, 'category'>[] };

    // Auto-categorize items
    const categorizedItems = await Promise.all(
      parsedResponse.items.map(async (item) => {
        const category = await suggestCategory(item.name);
        return { ...item, category };
      })
    );

    return { ...parsedResponse, items: categorizedItems };
  } catch (error) {
    console.error("Error analyzing receipt with Gemini:", error);
    throw new Error("No se pudo analizar el recibo. Por favor, inténtelo de nuevo o ingrese los datos manualmente.");
  }
};

export const suggestCategory = async (itemName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: `Sugiere una categoría de gasto simple (una o dos palabras) para el siguiente artículo: "${itemName}". Ejemplos: Comida, Transporte, Hogar, Entretenimiento, Ropa, Salud, Educación, Supermercado. Responde solo con la categoría.`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting category:", error);
        return "General";
    }
};
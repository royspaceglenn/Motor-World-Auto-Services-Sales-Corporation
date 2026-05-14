import type { InventoryItem, Transaction } from '../types';

function envApiKey(): string {
  const v = process.env.API_KEY;
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : '';
}

/** Lazy client so @google/genai is not loaded until an AI feature runs (avoids renderer crash on import). */
let clientPromise: Promise<{ models: { generateContent: (args: unknown) => Promise<{ text?: string }> } } | null> | null =
  null;

async function getClient() {
  const key = envApiKey();
  if (!key) return null;
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        return new GoogleGenAI({ apiKey: key });
      } catch (err) {
        console.error('Gemini client init failed:', err);
        return null;
      }
    })();
  }
  return clientPromise;
}

export const getInventoryInsights = async (
  inventory: InventoryItem[],
  history: Transaction[],
  userPrompt: string,
): Promise<string> => {
  const ai = await getClient();
  if (!ai) return 'API Key is missing. Unable to generate insights.';

  const inventorySummary = inventory
    .map((i) => `- ${i.name} (${i.category}): ${i.quantity} units @ ₱${i.unitPrice}`)
    .join('\n');

  const recentHistory = history
    .slice(0, 15)
    .map((h) => {
      const ts = String(h.timestamp ?? '');
      const day = ts.includes('T') ? ts.split('T')[0] : ts.slice(0, 10);
      return `- ${day}: ${h.type} ${h.quantityChange} of ${h.itemName} at ₱${h.unitPriceAtTime}`;
    })
    .join('\n');

  const prompt = `
    You are an expert inventory analyst assistant for a business. The currency is Philippine Peso (₱).
    
    Current Inventory Data:
    ${inventorySummary}

    Recent Transaction History (Last 15):
    ${recentHistory}

    User Question: "${userPrompt}"

    Analyze the data provided and answer the user's question. 
    If the user asks for suggestions, provide data-backed recommendations.
    Keep the tone professional yet helpful. Keep the response concise (under 150 words) unless detailed analysis is requested.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || 'No insight generated.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'I encountered an issue analyzing your inventory. Please try again later.';
  }
};

export const generateItemDescription = async (name: string, category: string): Promise<string> => {
  const ai = await getClient();
  if (!ai) return '';

  const prompt = `Write a short, professional product description (max 2 sentences) for an inventory item named "${name}" in the category "${category}".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '';
  } catch {
    return '';
  }
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inicializar Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Normalizar nome do alimento
function normalizeFoodName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Buscar no banco local primeiro
async function searchLocalDatabase(foodName: string) {
  const normalized = normalizeFoodName(foodName);
  
  const { data, error } = await supabase
    .from('food_database')
    .select('*')
    .eq('food_name_normalized', normalized)
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error searching local database:', error);
    return null;
  }
  
  return data;
}

// Buscar na API Open Food Facts
async function searchOpenFoodFacts(foodName: string) {
  try {
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&search_simple=1&action=process&json=1&page_size=1&fields=product_name,nutriments,brands,code,image_url`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) return null;
    
    const product = data.products[0];
    const nutriments = product.nutriments || {};
    
    // Valores por 100g
    const nutritionData = {
      food_name: product.product_name || foodName,
      food_name_normalized: normalizeFoodName(product.product_name || foodName),
      source: 'open_food_facts',
      source_id: product.code,
      calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
      protein: parseFloat((nutriments.proteins_100g || nutriments.proteins || 0).toFixed(1)),
      carbs: parseFloat((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0).toFixed(1)),
      fats: parseFloat((nutriments.fat_100g || nutriments.fat || 0).toFixed(1)),
      fiber: nutriments.fiber_100g || nutriments.fiber || null,
      sodium: nutriments.sodium_100g || nutriments.sodium || null,
      brand: product.brands || null,
      image_url: product.image_url || null,
      barcode: product.code || null,
      is_verified: true
    };
    
    // Salvar no banco local como cache
    await supabase.from('food_database').insert(nutritionData).select().maybeSingle();
    
    return nutritionData;
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return null;
  }
}

// Usar IA apenas como fallback
async function getFallbackNutrition(foodName: string, amount: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `Você é um nutricionista especializado. Analise o seguinte alimento e forneça as informações nutricionais precisas POR 100g.

Alimento: ${foodName}

IMPORTANTE: Forneça os valores SEMPRE para 100g do alimento, independente da quantidade informada pelo usuário (${amount}).

Responda APENAS com os valores numéricos para 100g do alimento, sem explicações adicionais.`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em nutrição. Responda sempre em JSON válido com as chaves: calories, protein, carbs, fats. Todos os valores devem ser números inteiros.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_nutrition_info',
              description: 'Fornece informações nutricionais do alimento',
              parameters: {
                type: 'object',
                properties: {
                  calories: {
                    type: 'integer',
                    description: 'Calorias totais em kcal'
                  },
                  protein: {
                    type: 'number',
                    description: 'Proteínas em gramas'
                  },
                  carbs: {
                    type: 'number',
                    description: 'Carboidratos em gramas'
                  },
                  fats: {
                    type: 'number',
                    description: 'Gorduras em gramas'
                  }
                },
                required: ['calories', 'protein', 'carbs', 'fats'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_nutrition_info' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

  const aiData = await aiResponse.json();
  console.log('AI Response:', JSON.stringify(aiData));

  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error('No tool call in AI response');
  }

  const nutritionData = JSON.parse(toolCall.function.arguments);
  
  // Salvar estimativa da IA no banco com source 'ai_estimate'
  const aiEstimate = {
    food_name: foodName,
    food_name_normalized: normalizeFoodName(foodName),
    source: 'ai_estimate',
    source_id: null,
    calories: Math.round(nutritionData.calories),
    protein: parseFloat((nutritionData.protein).toFixed(1)),
    carbs: parseFloat((nutritionData.carbs).toFixed(1)),
    fats: parseFloat((nutritionData.fats).toFixed(1)),
    is_verified: false
  };
  
  await supabase.from('food_database').insert(aiEstimate).select().maybeSingle();
  
  return aiEstimate;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foodName, amount } = await req.json();
    console.log('Getting nutrition info for:', foodName, amount);

    if (!foodName) {
      return new Response(
        JSON.stringify({ error: 'Nome do alimento é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar no banco de dados local primeiro (cache + dados customizados)
    console.log('Searching local database...');
    let nutritionData = await searchLocalDatabase(foodName);
    
    if (nutritionData) {
      console.log('Found in local database:', nutritionData.source);
    } else {
      // 2. Se não encontrar, buscar na Open Food Facts
      console.log('Searching Open Food Facts API...');
      nutritionData = await searchOpenFoodFacts(foodName);
      
      if (nutritionData) {
        console.log('Found in Open Food Facts');
      } else {
        // 3. Como último recurso, usar IA (com aviso)
        console.log('Using AI as fallback (no data found in APIs)');
        nutritionData = await getFallbackNutrition(foodName, amount);
      }
    }

    // Calcular valores proporcionais à quantidade informada
    const parsedAmount = parseFloat(amount) || 100;
    const factor = parsedAmount / 100;

    return new Response(
      JSON.stringify({
        success: true,
        source: nutritionData.source,
        isEstimate: nutritionData.source === 'ai_estimate',
        nutrition: {
          calories: Math.round((nutritionData.calories || 0) * factor),
          protein: Math.round((nutritionData.protein || 0) * factor * 10) / 10,
          carbs: Math.round((nutritionData.carbs || 0) * factor * 10) / 10,
          fats: Math.round((nutritionData.fats || 0) * factor * 10) / 10
        },
        foodInfo: {
          name: nutritionData.food_name,
          brand: nutritionData.brand,
          imageUrl: nutritionData.image_url
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting food nutrition:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar informações nutricionais' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

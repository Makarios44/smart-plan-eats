import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foodName, amount } = await req.json();
    console.log('Getting nutrition info for:', foodName, amount);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Você é um nutricionista especializado. Analise o seguinte alimento e forneça as informações nutricionais precisas.

Alimento: ${foodName}
Quantidade: ${amount}

Forneça as informações nutricionais estimadas para esta quantidade específica. Seja preciso e baseie-se em dados nutricionais conhecidos.

Importante:
- Considere a quantidade informada (${amount})
- Se a quantidade não especificar unidade, assuma gramas
- Arredonde os valores para números inteiros
- Seja conservador e realista nas estimativas

Responda APENAS com os valores numéricos, sem explicações adicionais.`;

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
    console.log('Parsed nutrition data:', nutritionData);

    return new Response(
      JSON.stringify({
        success: true,
        nutrition: {
          calories: Math.round(nutritionData.calories),
          protein: Math.round(nutritionData.protein * 10) / 10,
          carbs: Math.round(nutritionData.carbs * 10) / 10,
          fats: Math.round(nutritionData.fats * 10) / 10
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

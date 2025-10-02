import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, foodToReplace, targetMacros } = await req.json();

    // Get user profile with restrictions
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    // Get user's pantry items
    const { data: pantryItems } = await supabaseClient
      .from('user_pantry')
      .select('*')
      .eq('user_id', user.id);

    const restrictions = (profile.restrictions || []) as string[];
    const availableFoods = (pantryItems || []).map((item: any) => 
      `${item.food_name} (${item.quantity || 'disponível'} ${item.unit || ''})`
    ).join(', ');

    let prompt = '';
    
    if (type === 'substitution') {
      prompt = `Você é um nutricionista especializado. Preciso de uma substituição para o seguinte alimento:

Alimento Original: ${foodToReplace}

Contexto do Usuário:
- Objetivo: ${profile.goal === 'lose' ? 'Emagrecimento' : profile.goal === 'gain' ? 'Ganho de massa' : 'Manutenção'}
- Restrições Alimentares: ${restrictions.length > 0 ? restrictions.join(', ') : 'Nenhuma'}
- Alimentos Disponíveis na Despensa: ${availableFoods || 'Não informado'}

Por favor, sugira 3 substituições equivalentes nutricionalmente, priorizando:
1. Alimentos que o usuário já tem disponível
2. Mesmo perfil de macronutrientes
3. Respeito às restrições alimentares

IMPORTANTE: Retorne APENAS um JSON válido sem markdown, no formato:
{
  "substitutions": [
    {
      "food_name": "Nome do alimento",
      "amount": "Quantidade (ex: 100g)",
      "calories": 150,
      "protein": 20,
      "carbs": 10,
      "fats": 5,
      "reason": "Breve explicação da equivalência",
      "available_in_pantry": true
    }
  ]
}`;
    } else if (type === 'creative_meal') {
      prompt = `Você é um nutricionista criativo. Preciso de uma sugestão de refeição completa.

Macros Restantes do Dia:
- Calorias: ${targetMacros.calories} kcal
- Proteínas: ${targetMacros.protein}g
- Carboidratos: ${targetMacros.carbs}g
- Gorduras: ${targetMacros.fats}g

Contexto do Usuário:
- Objetivo: ${profile.goal === 'lose' ? 'Emagrecimento' : profile.goal === 'gain' ? 'Ganho de massa' : 'Manutenção'}
- Tipo de Dieta: ${profile.diet_type || 'Sem restrições'}
- Restrições Alimentares: ${restrictions.length > 0 ? restrictions.join(', ') : 'Nenhuma'}
- Alimentos Disponíveis: ${availableFoods || 'Considere ingredientes comuns'}

Crie uma refeição criativa, saborosa e nutritiva que:
1. Atenda os macros alvo (tolerância de ±10%)
2. Priorize alimentos que o usuário já tem
3. Respeite todas as restrições
4. Seja prática de preparar

IMPORTANTE: Retorne APENAS um JSON válido sem markdown, no formato:
{
  "meal": {
    "name": "Nome da Refeição",
    "description": "Descrição apetitosa",
    "prep_time": "15 minutos",
    "ingredients": [
      {
        "food_name": "Ingrediente",
        "amount": "100g",
        "calories": 150,
        "protein": 20,
        "carbs": 10,
        "fats": 5,
        "available_in_pantry": true
      }
    ],
    "instructions": "Passo a passo de preparo",
    "totals": {
      "calories": 500,
      "protein": 40,
      "carbs": 50,
      "fats": 15
    }
  }
}`;
    }

    console.log("Calling Lovable AI for meal suggestions...");

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um nutricionista especializado em criar sugestões personalizadas. Sempre retorne JSON válido sem markdown.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log("AI Response received:", aiResponse.substring(0, 200));

    // Parse AI response
    let suggestion;
    try {
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      suggestion = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw response:", aiResponse);
      throw new Error('Erro ao processar resposta da IA. Tente novamente.');
    }

    // Save suggestion to database
    await supabaseClient
      .from('meal_suggestions')
      .insert({
        user_id: user.id,
        suggestion_type: type,
        original_food: foodToReplace || null,
        suggested_meal: suggestion,
        macros: type === 'creative_meal' ? suggestion.meal.totals : null
      });

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-meal-alternatives:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar sugestões'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
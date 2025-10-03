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

    // Get user data from request
    const { userProfile } = await req.json();
    
    // Create AI prompt with user data
    const prompt = `Você é um nutricionista especializado. Crie um plano alimentar detalhado e saudável para o seguinte perfil:

Dados do Usuário:
- Nome: ${userProfile.name}
- Idade: ${userProfile.age} anos
- Sexo: ${userProfile.gender === 'male' ? 'Masculino' : 'Feminino'}
- Peso: ${userProfile.weight}kg
- Altura: ${userProfile.height}cm
- Objetivo: ${userProfile.goal === 'lose' ? 'Emagrecer' : userProfile.goal === 'gain' ? 'Ganhar massa muscular' : 'Manter peso'}
- Nível de atividade: ${userProfile.activity_level}
- Tipo de trabalho: ${userProfile.work_type}
${userProfile.lifestyle_routine ? `- Rotina diária: ${userProfile.lifestyle_routine}` : ''}
- Refeições por dia: ${userProfile.meals_per_day || '4-5 refeições'}
- Tipo de dieta: ${userProfile.diet_type || 'sem restrições'}
- Restrições alimentares: ${userProfile.dietary_restrictions?.length > 0 ? userProfile.dietary_restrictions.join(', ') : 'nenhuma'}
- Alergias: ${userProfile.food_allergies?.length > 0 ? userProfile.food_allergies.join(', ') : 'nenhuma'}
${userProfile.disliked_foods ? `- Alimentos que não gosta: ${userProfile.disliked_foods}` : ''}
- Cozinhas preferidas: ${userProfile.preferred_cuisines?.length > 0 ? userProfile.preferred_cuisines.join(', ') : 'variada'}

Metas Nutricionais:
- Calorias diárias: ${userProfile.target_calories} kcal
- Proteínas: ${userProfile.target_protein}g
- Carboidratos: ${userProfile.target_carbs}g
- Gorduras: ${userProfile.target_fats}g

Por favor, crie um plano alimentar completo com 5 refeições (Café da Manhã às 07:30, Lanche da Manhã às 10:00, Almoço às 12:30, Lanche da Tarde às 16:00, e Jantar às 19:30), respeitando TODAS as restrições, alergias e preferências do usuário.

Para cada refeição, liste de 3 a 5 alimentos com:
- Nome do alimento
- Quantidade (em gramas ou unidades)
- Calorias
- Proteínas (g)
- Carboidratos (g)
- Gorduras (g)

IMPORTANTE: Retorne APENAS um JSON válido sem markdown ou explicações adicionais, no seguinte formato:

{
  "meals": [
    {
      "name": "Café da Manhã",
      "time": "07:30",
      "order": 1,
      "foods": [
        {
          "name": "Aveia integral",
          "amount": "50g",
          "calories": 180,
          "protein": 7,
          "carbs": 30,
          "fats": 3
        }
      ]
    }
  ]
}`;

    console.log("Calling Lovable AI...");

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um nutricionista especializado. Sempre retorne respostas em JSON válido sem markdown.' },
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

    // Parse AI response (remove markdown if present)
    let mealPlan;
    try {
      // Remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      mealPlan = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw response:", aiResponse);
      throw new Error('Erro ao processar resposta da IA. Tente novamente.');
    }

    // Calculate totals
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };

    mealPlan.meals.forEach((meal: any) => {
      meal.foods.forEach((food: any) => {
        totals.calories += food.calories;
        totals.protein += food.protein;
        totals.carbs += food.carbs;
        totals.fats += food.fats;
      });
    });

    return new Response(
      JSON.stringify({ 
        mealPlan: mealPlan.meals,
        totals
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-meal-plan:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar plano alimentar'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

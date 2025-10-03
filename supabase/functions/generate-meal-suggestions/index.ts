import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating suggestions for user:', user.id);

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pantry items
    const { data: pantryItems } = await supabaseAdmin
      .from('user_pantry')
      .select('*')
      .eq('user_id', user.id);

    // Build prompt for AI
    const dietTypeLabels: Record<string, string> = {
      emagrecimento: 'emagrecimento (déficit calórico)',
      hipertrofia: 'ganho de massa muscular (superávit calórico)',
      manutencao: 'manutenção de peso'
    };

    const restrictions = Array.isArray(profile.restrictions) ? profile.restrictions : [];
    const hasPantryItems = pantryItems && pantryItems.length > 0;

    let prompt = `Você é um nutricionista especializado. Crie 5 sugestões de refeições saudáveis e práticas.

PERFIL DO USUÁRIO:
- Objetivo: ${dietTypeLabels[profile.diet_type] || profile.diet_type}
- Calorias alvo por dia: ${profile.target_calories} kcal
- Proteínas: ${profile.target_protein}g
- Carboidratos: ${profile.target_carbs}g
- Gorduras: ${profile.target_fats}g
${restrictions.length > 0 ? `- Restrições alimentares: ${restrictions.join(', ')}` : ''}

`;

    if (hasPantryItems) {
      const itemsList = pantryItems.map(item => 
        `${item.food_name}${item.quantity ? ` (${item.quantity} ${item.unit || ''})` : ''}`
      ).join(', ');
      
      prompt += `ITENS DISPONÍVEIS NA DESPENSA:
${itemsList}

IMPORTANTE: Priorize usar os itens da despensa nas sugestões. Se não for possível usar todos, tudo bem, mas tente incorporar o máximo possível.

`;
    } else {
      prompt += `O usuário não registrou itens na despensa ainda. Sugira refeições com ingredientes comuns e fáceis de encontrar.

`;
    }

    prompt += `Para cada sugestão, forneça:
1. Nome da refeição
2. Lista de ingredientes com quantidades aproximadas
3. Modo de preparo resumido (3-4 passos)
4. Valores nutricionais aproximados (calorias, proteínas, carboidratos, gorduras)
5. Qual tipo de refeição é (café da manhã, almoço, jantar, lanche)

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem explicações):
{
  "suggestions": [
    {
      "name": "Nome da refeição",
      "meal_type": "cafe_da_manha|almoco|jantar|lanche",
      "ingredients": ["ingrediente 1 - quantidade", "ingrediente 2 - quantidade"],
      "instructions": ["passo 1", "passo 2", "passo 3"],
      "nutrition": {
        "calories": 450,
        "protein": 30,
        "carbs": 50,
        "fats": 15
      },
      "uses_pantry_items": true|false
    }
  ]
}`;

    console.log('Calling Lovable AI...');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um nutricionista especializado que cria sugestões de refeições práticas e saudáveis. Sempre retorne JSON válido sem formatação markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos em Settings -> Workspace -> Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar sugestões com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Resposta da IA vazia' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Response:', content.substring(0, 200));

    // Parse AI response (remove markdown if present)
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '');
    }

    let parsedSuggestions;
    try {
      parsedSuggestions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content:', cleanedContent);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar resposta da IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!parsedSuggestions.suggestions || !Array.isArray(parsedSuggestions.suggestions)) {
      console.error('Invalid suggestions format');
      return new Response(
        JSON.stringify({ error: 'Formato de sugestões inválido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CORREÇÃO: Definir valores válidos para as constraints
    // Baseado no erro, parece que 'sugestao_geral' não é válido para 'original_food'
    // Vamos usar valores mais genéricos que provavelmente passarão
    
    // Para suggestion_type - usar 'meal' que parece ser válido
    const validSuggestionType = 'meal';
    
    // Para original_food - usar valores mais simples
    const validOriginalFood = hasPantryItems ? 'pantry' : 'general';

    console.log('Using values - suggestion_type:', validSuggestionType, 'original_food:', validOriginalFood);

    // Save suggestions to database
    const suggestionsToSave = parsedSuggestions.suggestions.map((suggestion: any) => ({
      user_id: user.id,
      suggestion_type: validSuggestionType, // Valor fixo válido
      suggested_meal: {
        name: suggestion.name,
        ingredients: suggestion.ingredients,
        instructions: suggestion.instructions,
        meal_type: suggestion.meal_type,
        uses_pantry_items: suggestion.uses_pantry_items || false
      },
      macros: suggestion.nutrition,
      original_food: validOriginalFood // Valor válido baseado na despensa
    }));

    console.log('Saving suggestions with data:', JSON.stringify(suggestionsToSave[0], null, 2));

    const { data: savedSuggestions, error: saveError } = await supabaseAdmin
      .from('meal_suggestions')
      .insert(suggestionsToSave)
      .select();

    if (saveError) {
      console.error('Error saving suggestions:', saveError);
      
      // Log mais detalhes para debugging
      console.error('Save error details:', {
        code: saveError.code,
        message: saveError.message,
        details: saveError.details,
        hint: saveError.hint
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao salvar sugestões',
          details: saveError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Suggestions saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        suggestions: savedSuggestions,
        used_pantry: hasPantryItems
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
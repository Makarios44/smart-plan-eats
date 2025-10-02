import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching user data for predictions...');

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: feedbackHistory } = await supabase
      .from('weekly_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('week_date', { ascending: false })
      .limit(12);

    const { data: progressHistory } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    const { data: adjustmentHistory } = await supabase
      .from('adjustment_history')
      .select('*')
      .eq('user_id', user.id)
      .order('adjustment_date', { ascending: false })
      .limit(10);

    if (!profile || !feedbackHistory || feedbackHistory.length < 2) {
      return new Response(JSON.stringify({ 
        error: 'Dados insuficientes para análise preditiva. São necessárias pelo menos 2 semanas de feedback.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Preparar dados para a IA
    const analysisData = {
      profile: {
        goal: profile.goal,
        current_calories: profile.target_calories,
        current_macros: {
          protein: profile.target_protein,
          carbs: profile.target_carbs,
          fats: profile.target_fats
        },
        activity_level: profile.activity_level,
        diet_type: profile.diet_type
      },
      feedback_history: feedbackHistory.map(f => ({
        week: f.week_date,
        weight: f.current_weight,
        energy: f.energy_level,
        hunger: f.hunger_satisfaction,
        adherence: f.adherence_level,
        notes: f.notes
      })),
      progress_history: progressHistory?.map(p => ({
        date: p.date,
        weight: p.weight,
        notes: p.notes
      })) || [],
      adjustment_history: adjustmentHistory?.map(a => ({
        date: a.adjustment_date,
        reason: a.adjustment_reason,
        calorie_change: a.new_calories - a.previous_calories,
        macro_changes: {
          protein: a.new_protein - a.previous_protein,
          carbs: a.new_carbs - a.previous_carbs,
          fats: a.new_fats - a.previous_fats
        }
      })) || []
    };

    const prompt = `Você é um nutricionista especialista em análise de dados e machine learning nutricional.

Analise os dados históricos do usuário e forneça insights preditivos detalhados:

DADOS DO USUÁRIO:
${JSON.stringify(analysisData, null, 2)}

TAREFA:
Analise padrões individuais, preveja ajustes necessários e identifique riscos de queda de adesão.

RESPONDA NO SEGUINTE FORMATO JSON:
{
  "individual_patterns": {
    "weight_trend": "descrição da tendência de peso (subindo/descendo/estável)",
    "energy_pattern": "padrão de energia ao longo das semanas",
    "hunger_pattern": "padrão de fome/saciedade",
    "adherence_pattern": "padrão de adesão ao plano",
    "weekly_consistency": "análise de consistência semanal"
  },
  "predictions": {
    "next_week_weight": número estimado,
    "weight_confidence": "alta/média/baixa",
    "recommended_adjustment": {
      "should_adjust": boolean,
      "adjustment_type": "increase/decrease/maintain",
      "estimated_calories": número,
      "estimated_protein": número,
      "estimated_carbs": número,
      "estimated_fats": número,
      "reasoning": "razão detalhada para o ajuste"
    },
    "goal_timeline": "estimativa de quando o objetivo será alcançado"
  },
  "adherence_risk": {
    "risk_level": "baixo/médio/alto",
    "risk_factors": ["lista de fatores de risco identificados"],
    "warning_signs": ["sinais de alerta detectados"],
    "recommendations": ["recomendações específicas para melhorar adesão"]
  },
  "actionable_insights": [
    "insight 1 acionável",
    "insight 2 acionável",
    "insight 3 acionável"
  ],
  "success_indicators": [
    "indicador positivo 1",
    "indicador positivo 2"
  ]
}`;

    console.log('Calling Lovable AI for predictive analysis...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um especialista em nutrição e análise preditiva. Responda APENAS com JSON válido, sem markdown ou texto adicional.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Erro ao processar análise preditiva' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI Response:', aiContent);

    // Parse do JSON da resposta
    let predictions;
    try {
      // Remove markdown se houver
      const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      predictions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return new Response(JSON.stringify({ error: 'Erro ao processar resposta da IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      predictions,
      analysis_date: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in predict-patterns:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

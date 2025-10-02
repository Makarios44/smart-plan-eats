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

    const { feedbackData } = await req.json();
    
    // Get current profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil não encontrado');
    }

    // Get previous feedback to calculate trends
    const { data: previousFeedback } = await supabaseClient
      .from('weekly_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('week_date', { ascending: false })
      .limit(1);

    // Calculate weight change
    let weightChange = 0;
    if (previousFeedback && previousFeedback.length > 0) {
      weightChange = feedbackData.current_weight - previousFeedback[0].current_weight;
    } else {
      weightChange = feedbackData.current_weight - profile.weight;
    }

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabaseClient
      .from('weekly_feedback')
      .insert({
        user_id: user.id,
        week_date: feedbackData.week_date,
        current_weight: feedbackData.current_weight,
        energy_level: feedbackData.energy_level,
        hunger_satisfaction: feedbackData.hunger_satisfaction,
        adherence_level: feedbackData.adherence_level,
        notes: feedbackData.notes
      })
      .select()
      .single();

    if (feedbackError) {
      throw feedbackError;
    }

    // Calculate adjustments based on feedback
    let calorieAdjustment = 0;
    let adjustmentReason = [];

    const goal = profile.goal;
    
    // Weight-based adjustments
    if (goal === 'lose') {
      if (weightChange >= 0) {
        calorieAdjustment -= 200;
        adjustmentReason.push('Peso não diminuiu conforme esperado');
      } else if (weightChange < -1) {
        calorieAdjustment += 100;
        adjustmentReason.push('Perda de peso muito rápida');
      }
    } else if (goal === 'gain') {
      if (weightChange <= 0) {
        calorieAdjustment += 200;
        adjustmentReason.push('Peso não aumentou conforme esperado');
      } else if (weightChange > 1) {
        calorieAdjustment -= 100;
        adjustmentReason.push('Ganho de peso muito rápido');
      }
    }

    // Energy level adjustments
    if (feedbackData.energy_level <= 2) {
      calorieAdjustment += 100;
      adjustmentReason.push('Baixos níveis de energia relatados');
    }

    // Hunger satisfaction adjustments
    if (feedbackData.hunger_satisfaction <= 2) {
      calorieAdjustment += 150;
      adjustmentReason.push('Baixa saciedade relatada');
    }

    // Adherence adjustments
    if (feedbackData.adherence_level <= 2) {
      calorieAdjustment += 100;
      adjustmentReason.push('Baixa adesão ao plano');
    }

    // Calculate new macros
    const newCalories = Math.max(1200, profile.target_calories + calorieAdjustment);
    
    // Maintain macro ratios
    const proteinRatio = profile.target_protein / profile.target_calories;
    const carbsRatio = profile.target_carbs / profile.target_calories;
    const fatsRatio = profile.target_fats / profile.target_calories;

    const newProtein = Math.round(newCalories * proteinRatio);
    const newCarbs = Math.round(newCalories * carbsRatio);
    const newFats = Math.round(newCalories * fatsRatio);

    // Only update if there's a significant change
    if (Math.abs(calorieAdjustment) >= 50) {
      // Insert adjustment history
      await supabaseClient
        .from('adjustment_history')
        .insert({
          user_id: user.id,
          feedback_id: feedback.id,
          previous_calories: profile.target_calories,
          new_calories: newCalories,
          previous_protein: profile.target_protein,
          new_protein: newProtein,
          previous_carbs: profile.target_carbs,
          new_carbs: newCarbs,
          previous_fats: profile.target_fats,
          new_fats: newFats,
          adjustment_reason: adjustmentReason.join('; ')
        });

      // Update profile with new targets
      await supabaseClient
        .from('profiles')
        .update({
          weight: feedbackData.current_weight,
          target_calories: newCalories,
          target_protein: newProtein,
          target_carbs: newCarbs,
          target_fats: newFats,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          adjusted: true,
          adjustments: {
            calories: { old: profile.target_calories, new: newCalories },
            protein: { old: profile.target_protein, new: newProtein },
            carbs: { old: profile.target_carbs, new: newCarbs },
            fats: { old: profile.target_fats, new: newFats }
          },
          reasons: adjustmentReason
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Just update weight without macro adjustments
      await supabaseClient
        .from('profiles')
        .update({
          weight: feedbackData.current_weight,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          adjusted: false,
          message: 'Peso atualizado. Seus macros não precisam de ajustes no momento.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in process-weekly-feedback:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao processar feedback'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
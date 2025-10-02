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
    const { clientIds, adjustments, notifyClients } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Verify user is nutritionist or admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAuthorized = roles?.some(r => ['nutricionista', 'admin'].includes(r.role));
    if (!isAuthorized) {
      throw new Error('Unauthorized - Nutritionist role required');
    }

    const results = {
      success: [] as string[],
      failed: [] as { clientId: string; error: string }[]
    };

    for (const clientId of clientIds) {
      try {
        // Verify access to this client
        const { data: assignment } = await supabaseClient
          .from('client_assignments')
          .select('*')
          .eq('nutritionist_id', user.id)
          .eq('client_id', clientId)
          .eq('active', true)
          .maybeSingle();

        if (!assignment) {
          const isAdmin = roles?.some(r => r.role === 'admin');
          if (!isAdmin) {
            throw new Error('No access to this client');
          }
        }

        // Get current profile
        const { data: currentProfile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', clientId)
          .single();

        if (!currentProfile) {
          throw new Error('Client profile not found');
        }

        // Calculate new values
        const newCalories = adjustments.caloriesChange 
          ? currentProfile.target_calories + adjustments.caloriesChange
          : currentProfile.target_calories;

        const newProtein = adjustments.proteinChange
          ? currentProfile.target_protein + adjustments.proteinChange
          : currentProfile.target_protein;

        const newCarbs = adjustments.carbsChange
          ? currentProfile.target_carbs + adjustments.carbsChange
          : currentProfile.target_carbs;

        const newFats = adjustments.fatsChange
          ? currentProfile.target_fats + adjustments.fatsChange
          : currentProfile.target_fats;

        // Update profile
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            target_calories: newCalories,
            target_protein: newProtein,
            target_carbs: newCarbs,
            target_fats: newFats,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', clientId);

        if (updateError) throw updateError;

        // Log adjustment in history
        await supabaseClient
          .from('adjustment_history')
          .insert({
            user_id: clientId,
            previous_calories: currentProfile.target_calories,
            new_calories: newCalories,
            previous_protein: currentProfile.target_protein,
            new_protein: newProtein,
            previous_carbs: currentProfile.target_carbs,
            new_carbs: newCarbs,
            previous_fats: currentProfile.target_fats,
            new_fats: newFats,
            adjustment_reason: adjustments.reason || 'Ajuste em lote pelo nutricionista'
          });

        // Send notification if requested
        if (notifyClients) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: clientId,
              title: 'Plano Atualizado',
              message: `Seu plano alimentar foi ajustado. Novas metas: ${newCalories} calorias, ${newProtein}g proteína, ${newCarbs}g carboidratos, ${newFats}g gorduras.`,
              type: 'info'
            });
        }

        results.success.push(clientId);

      } catch (error) {
        results.failed.push({
          clientId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in batch-update-plans:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
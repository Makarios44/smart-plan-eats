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
    const { clientId, format, startDate, endDate } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Verify access to this client
    const { data: assignment } = await supabaseClient
      .from('client_assignments')
      .select('*')
      .eq('nutritionist_id', user.id)
      .eq('client_id', clientId)
      .eq('active', true)
      .single();

    if (!assignment) {
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const isAdmin = roles?.some(r => r.role === 'admin');
      if (!isAdmin) {
        throw new Error('Unauthorized - No access to this client');
      }
    }

    // Get client profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', clientId)
      .single();

    // Get progress tracking
    const { data: progressData } = await supabaseClient
      .from('progress_tracking')
      .select('*')
      .eq('user_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    // Get weekly feedback
    const { data: feedbackData } = await supabaseClient
      .from('weekly_feedback')
      .select('*')
      .eq('user_id', clientId)
      .gte('week_date', startDate)
      .lte('week_date', endDate)
      .order('week_date', { ascending: true });

    // Get adherence metrics
    const { data: adherenceData } = await supabaseClient
      .from('adherence_metrics')
      .select('*')
      .eq('user_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    // Get meal plans
    const { data: mealPlans } = await supabaseClient
      .from('meal_plans')
      .select(`
        *,
        meals (
          *,
          food_items (*)
        )
      `)
      .eq('user_id', clientId)
      .gte('plan_date', startDate)
      .lte('plan_date', endDate)
      .order('plan_date', { ascending: true });

    const reportData = {
      client: profile,
      period: { start: startDate, end: endDate },
      progress: progressData || [],
      feedback: feedbackData || [],
      adherence: adherenceData || [],
      mealPlans: mealPlans || [],
      summary: {
        totalDays: progressData?.length || 0,
        avgAdherence: adherenceData?.reduce((acc, d) => acc + d.adherence_percentage, 0) / (adherenceData?.length || 1),
        weightChange: progressData && progressData.length > 1 
          ? Number(progressData[progressData.length - 1].weight) - Number(progressData[0].weight)
          : 0,
        avgEnergy: feedbackData?.reduce((acc, f) => acc + f.energy_level, 0) / (feedbackData?.length || 1),
        avgSatisfaction: feedbackData?.reduce((acc, f) => acc + f.hunger_satisfaction, 0) / (feedbackData?.length || 1)
      }
    };

    // Format based on requested format
    if (format === 'csv') {
      let csv = 'Data,Peso,Peito,Cintura,Quadril,Adesão(%)\n';
      progressData?.forEach(p => {
        const adherence = adherenceData?.find(a => a.date === p.date);
        csv += `${p.date},${p.weight},${p.chest || ''},${p.waist || ''},${p.hip || ''},${adherence?.adherence_percentage || ''}\n`;
      });
      
      return new Response(csv, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio_${clientId}_${startDate}_${endDate}.csv"`
        },
      });
    }

    // Default JSON format
    return new Response(JSON.stringify(reportData, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-client-report:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
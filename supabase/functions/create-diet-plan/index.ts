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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating diet plan for user:', user.id);

    const { plan_name, plan_description, diet_type, plan_date } = await req.json();

    // Validate required fields
    if (!plan_name || !diet_type || !plan_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: plan_name, diet_type, plan_date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate diet_type
    const validDietTypes = ['emagrecimento', 'hipertrofia', 'manutencao'];
    if (!validDietTypes.includes(diet_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid diet_type. Must be: emagrecimento, hipertrofia, or manutencao' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the diet plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('meal_plans')
      .insert({
        user_id: user.id,
        plan_name,
        plan_description: plan_description || null,
        diet_type,
        plan_date,
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fats: 0
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      return new Response(
        JSON.stringify({ error: planError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Diet plan created successfully:', plan.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        plan: {
          id: plan.id,
          plan_name: plan.plan_name,
          plan_description: plan.plan_description,
          diet_type: plan.diet_type,
          recommended_exercise: plan.recommended_exercise,
          plan_date: plan.plan_date,
          total_calories: plan.total_calories,
          total_protein: plan.total_protein,
          total_carbs: plan.total_carbs,
          total_fats: plan.total_fats,
          created_at: plan.created_at
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

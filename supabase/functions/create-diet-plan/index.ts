import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify POST method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }), 
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No authorization header or invalid format');
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan_name, plan_description, diet_type, plan_date } = requestBody;

    // Validate required fields
    if (!plan_name?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Campo obrigatório: plan_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!diet_type) {
      return new Response(
        JSON.stringify({ error: 'Campo obrigatório: diet_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!plan_date) {
      return new Response(
        JSON.stringify({ error: 'Campo obrigatório: plan_date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate diet_type value
    const validDietTypes = ['emagrecimento', 'hipertrofia', 'manutencao'];
    if (!validDietTypes.includes(diet_type)) {
      return new Response(
        JSON.stringify({ 
          error: `diet_type inválido. Valores aceitos: ${validDietTypes.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate plan_name length
    if (plan_name.trim().length > 200) {
      return new Response(
        JSON.stringify({ error: 'plan_name deve ter no máximo 200 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate plan_description length if provided
    if (plan_description && plan_description.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'plan_description deve ter no máximo 1000 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating plan:', { user_id: user.id, plan_name, diet_type, plan_date });

    // Insert meal plan
    const { data: plan, error: insertError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        plan_name: plan_name.trim(),
        plan_description: plan_description?.trim() || null,
        diet_type,
        plan_date,
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fats: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          error: `Erro ao criar plano: ${insertError.message}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Plan created successfully:', plan.id);

    // Return success response
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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ error: `Erro interno: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

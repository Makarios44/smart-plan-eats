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

    // Get all clients assigned to this nutritionist
    const { data: assignments } = await supabaseClient
      .from('client_assignments')
      .select(`
        client_id,
        profiles!client_assignments_client_id_fkey (
          user_id,
          name,
          age,
          gender,
          goal,
          activity_level,
          work_type,
          target_calories,
          target_protein,
          target_carbs,
          target_fats
        )
      `)
      .eq('nutritionist_id', user.id)
      .eq('active', true);

    if (!assignments || assignments.length === 0) {
      return new Response(JSON.stringify({ 
        groups: [],
        message: 'No clients found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientIds = assignments.map(a => a.client_id);

    // Get recent feedback and adherence data
    const { data: feedbacks } = await supabaseClient
      .from('weekly_feedback')
      .select('*')
      .in('user_id', clientIds)
      .gte('week_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const { data: adherenceData } = await supabaseClient
      .from('adherence_metrics')
      .select('*')
      .in('user_id', clientIds)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Use Lovable AI to analyze patterns
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const analysisPrompt = `
Analise os seguintes dados de clientes de nutrição e identifique padrões e grupos:

Clientes: ${JSON.stringify(assignments)}
Feedbacks recentes: ${JSON.stringify(feedbacks || [])}
Métricas de adesão: ${JSON.stringify(adherenceData || [])}

Por favor, agrupe os clientes por:
1. Faixa etária (18-25, 26-35, 36-45, 46+)
2. Objetivo (perda de peso, ganho de massa, manutenção)
3. Nível de atividade física
4. Horários de treino/trabalho

Para cada grupo, calcule:
- Média de calorias alvo
- Média de macros (proteína, carboidratos, gorduras)
- Taxa média de adesão
- Níveis médios de energia e saciedade
- Principais desafios identificados

Forneça recomendações específicas para cada grupo, incluindo:
- Ajustes sugeridos de calorias
- Ajustes de macros
- Dicas de horários de refeições
- Estratégias para melhorar adesão

Responda em JSON estruturado.
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em análise de dados nutricionais. Sempre responda em JSON válido.' },
          { role: 'user', content: analysisPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_client_groups',
              description: 'Analisa grupos de clientes e retorna insights e recomendações',
              parameters: {
                type: 'object',
                properties: {
                  groups: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        client_count: { type: 'number' },
                        avg_calories: { type: 'number' },
                        avg_protein: { type: 'number' },
                        avg_carbs: { type: 'number' },
                        avg_fats: { type: 'number' },
                        avg_adherence: { type: 'number' },
                        recommendations: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      }
                    }
                  },
                  overall_insights: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['groups', 'overall_insights']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_client_groups' } }
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      throw new Error('Failed to analyze client groups');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    const analysis = toolCall ? JSON.parse(toolCall.function.arguments) : { groups: [], overall_insights: [] };

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-client-groups:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
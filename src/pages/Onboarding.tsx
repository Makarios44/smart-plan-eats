import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

type OnboardingStep = "personal" | "activity" | "goal" | "preferences";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>("personal");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    activityLevel: "",
    workType: "",
    goal: "",
    dietType: "",
    restrictions: [] as string[],
  });

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check if profile already exists
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            navigate("/dashboard");
          }
        });
    });
  }, [navigate]);

  const calculateTDEE = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age);
    
    let bmr = 0;
    if (formData.gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    return Math.round(bmr * (activityMultipliers[formData.activityLevel] || 1.2));
  };

  const calculateMacros = (tdee: number) => {
    let targetCalories = tdee;
    
    // Adjust calories based on goal
    if (formData.goal === "lose") {
      targetCalories = Math.round(tdee * 0.85); // 15% deficit
    } else if (formData.goal === "gain") {
      targetCalories = Math.round(tdee * 1.1); // 10% surplus
    }

    // Calculate macros (30% protein, 40% carbs, 30% fats)
    const protein = Math.round((targetCalories * 0.3) / 4); // 4 cal/g
    const carbs = Math.round((targetCalories * 0.4) / 4); // 4 cal/g
    const fats = Math.round((targetCalories * 0.3) / 9); // 9 cal/g

    return { targetCalories, protein, carbs, fats };
  };

  const handleNext = () => {
    // Validate current step
    if (step === "personal" && (!formData.name || !formData.age || !formData.gender || !formData.weight || !formData.height)) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    if (step === "activity" && (!formData.activityLevel || !formData.workType)) {
      toast.error("Por favor, selecione suas informações de atividade");
      return;
    }
    if (step === "goal" && !formData.goal) {
      toast.error("Por favor, selecione seu objetivo");
      return;
    }

    const steps: OnboardingStep[] = ["personal", "activity", "goal", "preferences"];
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ["personal", "activity", "goal", "preferences"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculate nutritional values
      const tdee = calculateTDEE();
      const macros = calculateMacros(tdee);

      // Save profile to database
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: user.id,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        activity_level: formData.activityLevel,
        work_type: formData.workType,
        goal: formData.goal,
        diet_type: formData.dietType || "regular",
        restrictions: formData.restrictions,
        tdee: tdee,
        target_calories: macros.targetCalories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fats: macros.fats,
      });

      if (profileError) throw profileError;

      // Generate meal plan with AI
      toast.info("Gerando seu plano alimentar personalizado...");

      const { data: mealPlanData, error: mealPlanError } = await supabase.functions.invoke("generate-meal-plan", {
        body: {
          userProfile: {
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender,
            weight: parseFloat(formData.weight),
            height: parseFloat(formData.height),
            goal: formData.goal,
            activity_level: formData.activityLevel,
            work_type: formData.workType,
            diet_type: formData.dietType || "regular",
            restrictions: formData.restrictions,
            target_calories: macros.targetCalories,
            target_protein: macros.protein,
            target_carbs: macros.carbs,
            target_fats: macros.fats,
          },
        },
      });

      if (mealPlanError) {
        console.error("Meal plan error:", mealPlanError);
        toast.warning("Perfil salvo! Você pode gerar seu plano depois.");
      } else if (mealPlanData) {
        // Save meal plan to database
        const today = new Date().toISOString().split('T')[0];
        
        const { data: planData, error: planError } = await supabase
          .from("meal_plans")
          .insert({
            user_id: user.id,
            plan_date: today,
            total_calories: mealPlanData.totals.calories,
            total_protein: mealPlanData.totals.protein,
            total_carbs: mealPlanData.totals.carbs,
            total_fats: mealPlanData.totals.fats,
          })
          .select()
          .single();

        if (planError || !planData) {
          console.error("Plan save error:", planError);
          throw new Error("Erro ao salvar plano");
        }

        // Save meals
        for (const meal of mealPlanData.mealPlan) {
          const { data: mealData, error: mealError } = await supabase
            .from("meals")
            .insert({
              meal_plan_id: planData.id,
              name: meal.name,
              time: meal.time,
              meal_order: meal.order,
            })
            .select()
            .single();

          if (mealError || !mealData) {
            console.error("Meal save error:", mealError);
            continue;
          }

          // Save food items
          for (const food of meal.foods) {
            await supabase.from("food_items").insert({
              meal_id: mealData.id,
              name: food.name,
              amount: food.amount,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fats: food.fats,
            });
          }
        }
      }

      toast.success("Perfil criado com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao criar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 shadow-lg animate-fade-in">
        {step === "personal" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Informações Pessoais</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label>Sexo</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="170"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleNext}>
                Próximo <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {step === "activity" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Nível de Atividade</h2>
            
            <div>
              <Label>Nível de Atividade Física</Label>
              <RadioGroup value={formData.activityLevel} onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="sedentary" id="sedentary" />
                  <Label htmlFor="sedentary" className="cursor-pointer flex-1">
                    <div className="font-medium">Sedentário</div>
                    <div className="text-sm text-muted-foreground">Pouco ou nenhum exercício</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="cursor-pointer flex-1">
                    <div className="font-medium">Leve</div>
                    <div className="text-sm text-muted-foreground">Exercício 1-3 dias/semana</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="cursor-pointer flex-1">
                    <div className="font-medium">Moderado</div>
                    <div className="text-sm text-muted-foreground">Exercício 3-5 dias/semana</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active" className="cursor-pointer flex-1">
                    <div className="font-medium">Ativo</div>
                    <div className="text-sm text-muted-foreground">Exercício 6-7 dias/semana</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="veryActive" id="veryActive" />
                  <Label htmlFor="veryActive" className="cursor-pointer flex-1">
                    <div className="font-medium">Muito Ativo</div>
                    <div className="text-sm text-muted-foreground">Exercício intenso diário</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Tipo de Trabalho</Label>
              <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desk">Trabalho de escritório (sentado)</SelectItem>
                  <SelectItem value="standing">Trabalho em pé</SelectItem>
                  <SelectItem value="physical">Trabalho físico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-5 h-5" /> Voltar
              </Button>
              <Button onClick={handleNext}>
                Próximo <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {step === "goal" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Qual é seu objetivo?</h2>
            
            <RadioGroup value={formData.goal} onValueChange={(value) => setFormData({ ...formData, goal: value })}>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="lose" id="lose" />
                <Label htmlFor="lose" className="cursor-pointer flex-1">
                  <div className="font-medium text-lg">Perder Peso</div>
                  <div className="text-sm text-muted-foreground">Déficit calórico controlado</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="maintain" id="maintain" />
                <Label htmlFor="maintain" className="cursor-pointer flex-1">
                  <div className="font-medium text-lg">Manter Peso</div>
                  <div className="text-sm text-muted-foreground">Calorias de manutenção</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="gain" id="gain" />
                <Label htmlFor="gain" className="cursor-pointer flex-1">
                  <div className="font-medium text-lg">Ganhar Massa Muscular</div>
                  <div className="text-sm text-muted-foreground">Superávit calórico + treino</div>
                </Label>
              </div>
            </RadioGroup>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-5 h-5" /> Voltar
              </Button>
              <Button onClick={handleNext}>
                Próximo <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {step === "preferences" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Preferências Alimentares</h2>
            
            <div>
              <Label>Tipo de Dieta</Label>
              <Select value={formData.dietType} onValueChange={(value) => setFormData({ ...formData, dietType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular (sem restrições)</SelectItem>
                  <SelectItem value="vegetarian">Vegetariano</SelectItem>
                  <SelectItem value="vegan">Vegano</SelectItem>
                  <SelectItem value="lowCarb">Low Carb</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Restrições Alimentares (opcional)</Label>
              <div className="space-y-2 mt-2">
                {["Lactose", "Glúten", "Frutos do mar", "Nozes"].map((restriction) => (
                  <div key={restriction} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={restriction}
                      checked={formData.restrictions.includes(restriction)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, restrictions: [...formData.restrictions, restriction] });
                        } else {
                          setFormData({ ...formData, restrictions: formData.restrictions.filter(r => r !== restriction) });
                        }
                      }}
                      className="rounded border-border"
                    />
                    <Label htmlFor={restriction} className="cursor-pointer">{restriction}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-5 h-5" /> Voltar
              </Button>
              <Button onClick={handleNext} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Criando seu plano...
                  </>
                ) : (
                  <>
                    Finalizar <Sparkles className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Onboarding;

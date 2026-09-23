import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  MEAL_TYPES,
  WORKOUT_TYPES,
  dateKey,
  fetchDailyRecord,
  fetchMeals,
  requireUserId,
  type Meal,
} from "@/lib/health";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/tracker")({
  head: () => ({
    meta: [
      { title: "Daily Tracker — HealthTrack" },
      { name: "description", content: "Record steps, sleep, workouts, water and meals by date." },
      { property: "og:title", content: "Daily Tracker — HealthTrack" },
      {
        property: "og:description",
        content: "Record steps, sleep, workouts, water and meals by date.",
      },
    ],
  }),
  component: TrackerPage,
});

const today = () => dateKey(new Date());

function TrackerPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(today());

  const recordQuery = useQuery({
    queryKey: ["daily", date],
    queryFn: () => fetchDailyRecord(date),
  });
  const mealsQuery = useQuery({ queryKey: ["meals", date], queryFn: () => fetchMeals(date) });

  const [steps, setSteps] = useState("");
  const [sleep, setSleep] = useState("");
  const [workoutDone, setWorkoutDone] = useState("no");
  const [workoutType, setWorkoutType] = useState("");
  const [water, setWater] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (recordQuery.isLoading) return;
    if (loadedFor.current === date) return;
    loadedFor.current = date;
    const rec = recordQuery.data;
    setSteps(rec?.steps != null ? String(rec.steps) : "");
    setSleep(rec?.sleep_hours != null ? String(rec.sleep_hours) : "");
    setWorkoutDone(rec?.workout_done ? "yes" : "no");
    setWorkoutType(rec?.workout_type ?? "");
    setWater(rec?.water_litres != null ? String(rec.water_litres) : "");
    setErrors({});
  }, [recordQuery.data, recordQuery.isLoading, date]);

  const saveDaily = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const { error } = await supabase.from("daily_health_records").upsert(
        {
          user_id: userId,
          record_date: date,
          steps: steps === "" ? null : Math.trunc(Number(steps)),
          sleep_hours: sleep === "" ? null : Number(sleep),
          workout_done: workoutDone === "yes",
          workout_type: workoutDone === "yes" ? workoutType : null,
          water_litres: water === "" ? null : Number(water),
        },
        { onConflict: "user_id,record_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Daily data saved");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submitDaily(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (steps !== "" && Number(steps) < 0) next["steps"] = "Steps must be 0 or more";
    if (sleep !== "" && (Number(sleep) < 0 || Number(sleep) > 24))
      next["sleep"] = "Sleep must be between 0 and 24";
    if (water !== "" && Number(water) < 0) next["water"] = "Water must be 0 or more";
    if (workoutDone === "yes" && !workoutType) next["workoutType"] = "Workout type is required";
    setErrors(next);
    if (Object.keys(next).length) return;
    saveDaily.mutate();
  }

  const meals = mealsQuery.data ?? [];
  const totalCalories = meals.reduce((sum, m) => sum + Number(m.calories), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Tracker</h1>
          <p className="text-sm text-muted-foreground">Pick a date and record your day.</p>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            max={today()}
            value={date}
            onChange={(e) => setDate(e.target.value || today())}
            className="sm:w-48"
          />
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily health data</CardTitle>
          <CardDescription>Leave a field empty if you did not track it.</CardDescription>
        </CardHeader>
        <CardContent>
          {recordQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <form className="grid gap-5 sm:grid-cols-2" onSubmit={submitDaily}>
              <div className="space-y-2">
                <Label>Steps</Label>
                <Input
                  type="number"
                  min="0"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                />
                {errors["steps"] ? (
                  <p className="text-xs text-destructive">{errors["steps"]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Sleep (hours)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                />
                {errors["sleep"] ? (
                  <p className="text-xs text-destructive">{errors["sleep"]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Did you work out?</Label>
                <Select
                  value={workoutDone}
                  onValueChange={(v) => {
                    setWorkoutDone(v);
                    if (v === "no") setWorkoutType("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {workoutDone === "yes" ? (
                <div className="space-y-2">
                  <Label>Workout Type</Label>
                  <Select value={workoutType} onValueChange={setWorkoutType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKOUT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors["workoutType"] ? (
                    <p className="text-xs text-destructive">{errors["workoutType"]}</p>
                  ) : null}
                </div>
              ) : (
                <div className="hidden sm:block" />
              )}
              <div className="space-y-2">
                <Label>Water (litres)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={water}
                  onChange={(e) => setWater(e.target.value)}
                />
                {errors["water"] ? (
                  <p className="text-xs text-destructive">{errors["water"]}</p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saveDaily.isPending}>
                  {saveDaily.isPending ? "Saving..." : "Save Daily Data"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <MealsSection date={date} meals={meals} loading={mealsQuery.isLoading} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Summary label="Steps" value={steps === "" ? "—" : Number(steps).toLocaleString()} />
          <Summary label="Total Calories" value={totalCalories.toLocaleString()} />
          <Summary label="Sleep" value={sleep === "" ? "—" : `${sleep} h`} />
          <Summary label="Workout" value={workoutDone === "yes" ? "Yes" : "No"} />
          <Summary label="Workout Type" value={workoutType || "—"} />
          <Summary label="Water" value={water === "" ? "—" : `${water} L`} />
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function MealsSection({
  date,
  meals,
  loading,
}: {
  date: string;
  meals: Meal[];
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Meal | null>(null);
  const [type, setType] = useState<string>("Breakfast");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setEditing(null);
    setType("Breakfast");
    setName("");
    setCalories("");
    setErrors({});
  }

  const save = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const payload = {
        user_id: userId,
        meal_date: date,
        meal_type: type,
        meal_name: name.trim(),
        calories: calories === "" ? 0 : Number(calories),
      };
      if (editing) {
        const { error } = await supabase.from("meals").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Meal updated" : "Meal added");
      reset();
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meal deleted");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!type) next["type"] = "Meal type is required";
    if (!name.trim()) next["name"] = "Meal name is required";
    if (calories !== "" && Number(calories) < 0) next["calories"] = "Calories must be 0 or more";
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  const total = meals.reduce((sum, m) => sum + Number(m.calories), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">Meals</CardTitle>
          <CardDescription>Everything you ate on this date.</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Calories Today</p>
          <p className="text-xl font-semibold">{total.toLocaleString()}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="grid gap-4 sm:grid-cols-4 sm:items-end" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Meal Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Oatmeal" />
            {errors["name"] ? <p className="text-xs text-destructive">{errors["name"]}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Calories</Label>
            <Input
              type="number"
              min="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
            {errors["calories"] ? (
              <p className="text-xs text-destructive">{errors["calories"]}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving..." : editing ? "Update Meal" : "Add Meal"}
            </Button>
            {editing ? (
              <Button type="button" variant="outline" onClick={reset}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : meals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No meals recorded for this date.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {meals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="w-20 shrink-0 text-muted-foreground">{meal.meal_type}</span>
                <span className="flex-1 truncate font-medium">{meal.meal_name}</span>
                <span className="w-20 text-right">{Number(meal.calories)} kcal</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit meal"
                  onClick={() => {
                    setEditing(meal);
                    setType(meal.meal_type);
                    setName(meal.meal_name);
                    setCalories(String(meal.calories));
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete meal"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(meal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

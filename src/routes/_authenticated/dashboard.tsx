import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isFuture,
  startOfMonth,
} from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  Footprints,
  Flame,
  Moon,
  Dumbbell,
  Droplets,
  Scale,
} from "lucide-react";

import {
  average,
  dateKey,
  fetchProfile,
  fetchRangeMeals,
  fetchRangeRecords,
  fetchRangeWeights,
  greeting,
  toKg,
} from "@/lib/health";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HealthTrack" },
      { name: "description", content: "Monthly overview of your steps, calories, sleep and more." },
      { property: "og:title", content: "Dashboard — HealthTrack" },
      {
        property: "og:description",
        content: "Monthly overview of your steps, calories, sleep and more.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const from = dateKey(startOfMonth(month));
  const to = dateKey(endOfMonth(month));

  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const recordsQuery = useQuery({
    queryKey: ["records", from, to],
    queryFn: () => fetchRangeRecords(from, to),
  });
  const mealsQuery = useQuery({
    queryKey: ["meals-range", from, to],
    queryFn: () => fetchRangeMeals(from, to),
  });
  const weightsQuery = useQuery({
    queryKey: ["weights-range", from, to],
    queryFn: () => fetchRangeWeights(from, to),
  });

  const loading = recordsQuery.isLoading || mealsQuery.isLoading || weightsQuery.isLoading;
  const records = recordsQuery.data ?? [];
  const meals = mealsQuery.data ?? [];
  const weights = weightsQuery.data ?? [];

  const caloriesByDate = new Map<string, number>();
  for (const meal of meals) {
    caloriesByDate.set(meal.meal_date, (caloriesByDate.get(meal.meal_date) ?? 0) + meal.calories);
  }
  const mealDates = new Set(meals.map((m) => m.meal_date));

  const avgSteps = average(
    records.filter((r) => r.steps != null).map((r) => Number(r.steps)),
  );
  const avgCalories = average([...caloriesByDate.values()]);
  const avgSleep = average(
    records.filter((r) => r.sleep_hours != null).map((r) => Number(r.sleep_hours)),
  );
  const workoutDays = records.filter((r) => r.workout_done).length;
  const avgWater = average(
    records.filter((r) => r.water_litres != null).map((r) => Number(r.water_litres)),
  );

  const weightKg = weights.map((w) => toKg(Number(w.weight), w.weight_unit));
  const weightChange =
    weightKg.length >= 2 ? (weightKg.at(-1) as number) - (weightKg[0] as number) : null;

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const recordByDate = new Map(records.map((r) => [r.record_date, r]));

  const activityData = days.map((day) => {
    const key = dateKey(day);
    const rec = recordByDate.get(key);
    return {
      day: format(day, "d"),
      steps: rec?.steps ?? null,
      calories: caloriesByDate.get(key) ?? null,
      water: rec?.water_litres ?? null,
    };
  });
  const hasActivity = activityData.some(
    (d) => d.steps != null || d.calories != null || d.water != null,
  );

  const weightData = weights.map((w) => ({
    date: format(new Date(w.entry_date), "MMM d"),
    weight: toKg(Number(w.weight), w.weight_unit),
  }));

  const hasAnyData = records.length > 0 || meals.length > 0 || weights.length > 0;
  const name = profileQuery.data?.full_name?.trim().split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {name}
          </h1>
          <p className="text-sm text-muted-foreground">{format(month, "MMMM yyyy")} overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>
            This month
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !hasAnyData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">No health data yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start tracking your daily activity to see your progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              icon={Footprints}
              label="Average Steps"
              value={avgSteps == null ? "—" : Math.round(avgSteps).toLocaleString()}
            />
            <Kpi
              icon={Flame}
              label="Average Calories"
              value={avgCalories == null ? "—" : Math.round(avgCalories).toLocaleString()}
            />
            <Kpi
              icon={Moon}
              label="Average Sleep"
              value={avgSleep == null ? "—" : `${avgSleep.toFixed(1)} h`}
            />
            <Kpi icon={Dumbbell} label="Workout Days" value={String(workoutDays)} />
            <Kpi
              icon={Droplets}
              label="Average Water"
              value={avgWater == null ? "—" : `${avgWater.toFixed(1)} L`}
            />
            <Kpi
              icon={Scale}
              label="Weight Change"
              value={
                weightChange == null
                  ? "—"
                  : `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg`
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Activity Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {hasActivity ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData} margin={{ left: -10, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="steps"
                      name="Steps"
                      stroke="var(--chart-1)"
                      dot={false}
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="calories"
                      name="Calories"
                      stroke="var(--chart-2)"
                      dot={false}
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="water"
                      name="Water (L)"
                      stroke="var(--chart-3)"
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weight Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData} margin={{ left: -10, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight (kg)"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Tracking Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {days.map((day) => {
                  const key = dateKey(day);
                  const rec = recordByDate.get(key);
                  const future = isFuture(day) && dateKey(day) !== dateKey(new Date());
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border border-border p-2 text-xs ${future ? "opacity-40" : ""}`}
                    >
                      <p className="mb-2 font-medium">{format(day, "MMM d")}</p>
                      <div className="flex flex-wrap gap-1">
                        <Dot on={rec?.steps != null} label="Steps" />
                        <Dot on={mealDates.has(key)} label="Meals" />
                        <Dot on={rec?.sleep_hours != null} label="Sleep" />
                        <Dot on={!!rec?.workout_done} label="Workout" />
                        <Dot on={rec?.water_litres != null} label="Water" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Dot({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      title={label}
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
        on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {label.slice(0, 2)}
    </span>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No data available for this period.
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

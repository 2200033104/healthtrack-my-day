import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { dateKey, fetchWeightEntries, requireUserId, toKg, type WeightEntry } from "@/lib/health";
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

export const Route = createFileRoute("/_authenticated/weight")({
  head: () => ({
    meta: [
      { title: "Weight Progress — HealthTrack" },
      { name: "description", content: "Log your weight and follow your progress over time." },
      { property: "og:title", content: "Weight Progress — HealthTrack" },
      { property: "og:description", content: "Log your weight and follow your progress." },
    ],
  }),
  component: WeightPage,
});

function WeightPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["weights"], queryFn: fetchWeightEntries });
  const entries = data ?? [];

  const [editing, setEditing] = useState<WeightEntry | null>(null);
  const [date, setDate] = useState(dateKey(new Date()));
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("kg");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setEditing(null);
    setDate(dateKey(new Date()));
    setWeight("");
    setUnit("kg");
    setErrors({});
  }

  const save = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const payload = {
        user_id: userId,
        entry_date: date,
        weight: Number(weight),
        weight_unit: unit,
      };
      if (editing) {
        const { error } = await supabase
          .from("weight_entries")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("weight_entries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Weight updated" : "Weight added");
      reset();
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weight_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry deleted");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!date) next["date"] = "Date is required";
    if (weight === "" || Number(weight) <= 0) next["weight"] = "Weight must be greater than 0";
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  const ascending = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const first = ascending[0];
  const last = ascending.at(-1);
  const change =
    first && last && ascending.length >= 2
      ? toKg(Number(last.weight), last.weight_unit) - toKg(Number(first.weight), first.weight_unit)
      : null;

  const chartData = ascending.map((e) => ({
    date: format(new Date(e.entry_date), "MMM d"),
    weight: toKg(Number(e.weight), e.weight_unit),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Weight Progress</h1>
        <p className="text-sm text-muted-foreground">Log entries and follow your trend.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Starting Weight"
          value={first ? `${Number(first.weight)} ${first.weight_unit}` : "—"}
        />
        <Stat
          label="Current Weight"
          value={last ? `${Number(last.weight)} ${last.weight_unit}` : "—"}
        />
        <Stat
          label="Total Change"
          value={change == null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editing ? "Edit entry" : "Add weight"}</CardTitle>
          <CardDescription>Weights are charted in kilograms.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-4 sm:items-end" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {errors["date"] ? (
                <p className="text-xs text-destructive">{errors["date"]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Weight</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              {errors["weight"] ? (
                <p className="text-xs text-destructive">{errors["weight"]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving..." : editing ? "Update" : "Add"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={reset}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weight Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -10, right: 8 }}>
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
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No data available for this period.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No weight entries yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((entry) => {
                const idx = ascending.findIndex((e) => e.id === entry.id);
                const prev = idx > 0 ? ascending[idx - 1] : undefined;
                const diff = prev
                  ? toKg(Number(entry.weight), entry.weight_unit) -
                    toKg(Number(prev.weight), prev.weight_unit)
                  : null;
                return (
                  <div key={entry.id} className="flex items-center gap-3 py-3 text-sm">
                    <span className="w-24 shrink-0 text-muted-foreground">
                      {format(new Date(entry.entry_date), "MMM d, yyyy")}
                    </span>
                    <span className="flex-1 font-medium">
                      {Number(entry.weight)} {entry.weight_unit}
                    </span>
                    <span
                      className={
                        diff == null
                          ? "w-20 text-muted-foreground"
                          : diff > 0
                            ? "w-20 text-destructive"
                            : "w-20 text-primary"
                      }
                    >
                      {diff == null ? "—" : `${diff > 0 ? "+" : ""}${diff.toFixed(1)} kg`}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit entry"
                      onClick={() => {
                        setEditing(entry);
                        setDate(entry.entry_date);
                        setWeight(String(entry.weight));
                        setUnit(entry.weight_unit);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete entry"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

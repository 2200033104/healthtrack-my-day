import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"] as const;
export const WORKOUT_TYPES = [
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Full Body",
  "Cardio",
  "Other",
] as const;
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  gender: string | null;
  height: number | null;
  height_unit: string;
  current_weight: number | null;
  weight_unit: string;
};

export type DailyRecord = {
  id: string;
  record_date: string;
  steps: number | null;
  sleep_hours: number | null;
  workout_done: boolean;
  workout_type: string | null;
  water_litres: number | null;
};

export type Meal = {
  id: string;
  meal_date: string;
  meal_type: string;
  meal_name: string;
  calories: number;
};

export type WeightEntry = {
  id: string;
  entry_date: string;
  weight: number;
  weight_unit: string;
};

export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

export async function requireUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function fetchProfile(): Promise<Profile | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchDailyRecord(date: string): Promise<DailyRecord | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("daily_health_records")
    .select("*")
    .eq("user_id", userId)
    .eq("record_date", date)
    .maybeSingle();
  if (error) throw error;
  return data as DailyRecord | null;
}

export async function fetchMeals(date: string): Promise<Meal[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .eq("meal_date", date)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Meal[];
}

export async function fetchWeightEntries(): Promise<WeightEntry[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WeightEntry[];
}

export async function fetchRangeRecords(from: string, to: string): Promise<DailyRecord[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("daily_health_records")
    .select("*")
    .eq("user_id", userId)
    .gte("record_date", from)
    .lte("record_date", to)
    .order("record_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DailyRecord[];
}

export async function fetchRangeMeals(from: string, to: string): Promise<Meal[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .gte("meal_date", from)
    .lte("meal_date", to);
  if (error) throw error;
  return (data ?? []) as Meal[];
}

export async function fetchRangeWeights(from: string, to: string): Promise<WeightEntry[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", from)
    .lte("entry_date", to)
    .order("entry_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WeightEntry[];
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function toKg(weight: number, unit: string) {
  return unit === "lbs" ? weight * 0.45359237 : weight;
}

export function calcBmi(
  height: number | null,
  heightUnit: string,
  weight: number | null,
  weightUnit: string,
): number | null {
  if (!height || !weight || height <= 0 || weight <= 0) return null;
  const metres = heightUnit === "ft" ? height * 0.3048 : height / 100;
  if (metres <= 0) return null;
  return toKg(weight, weightUnit) / (metres * metres);
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

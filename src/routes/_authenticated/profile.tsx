import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { GENDERS, calcBmi, fetchProfile, requireUserId } from "@/lib/health";
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

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — HealthTrack" },
      { name: "description", content: "Manage your HealthTrack profile, body metrics and units." },
      { property: "og:title", content: "Profile — HealthTrack" },
      { property: "og:description", content: "Manage your profile, body metrics and units." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("none");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setGender(profile.gender ?? "none");
    setHeight(profile.height != null ? String(profile.height) : "");
    setHeightUnit(profile.height_unit ?? "cm");
    setWeight(profile.current_weight != null ? String(profile.current_weight) : "");
    setWeightUnit(profile.weight_unit ?? "kg");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          full_name: fullName.trim(),
          gender: gender === "none" ? null : gender,
          height: height === "" ? null : Number(height),
          height_unit: heightUnit,
          current_weight: weight === "" ? null : Number(weight),
          weight_unit: weightUnit,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!fullName.trim()) next["full_name"] = "Full name is required";
    if (height !== "" && Number(height) <= 0) next["height"] = "Height must be greater than 0";
    if (weight !== "" && Number(weight) <= 0) next["weight"] = "Weight must be greater than 0";
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  const bmi = calcBmi(
    height === "" ? null : Number(height),
    heightUnit,
    weight === "" ? null : Number(weight),
    weightUnit,
  );

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-3xl rounded-xl" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your personal details. Only you can see this information.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>Update your name, body metrics and preferred units.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2 sm:col-span-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              {errors["full_name"] ? (
                <p className="text-xs text-destructive">{errors["full_name"]}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Gender (optional)</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Height</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
              {errors["height"] ? (
                <p className="text-xs text-destructive">{errors["height"]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Height Unit</Label>
              <Select value={heightUnit} onValueChange={setHeightUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Current Weight</Label>
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
              <Label>Weight Unit</Label>
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BMI</CardTitle>
          <CardDescription>Informational only — not medical advice.</CardDescription>
        </CardHeader>
        <CardContent>
          {bmi ? (
            <p className="text-3xl font-semibold">{bmi.toFixed(1)}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add height and weight to calculate BMI.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

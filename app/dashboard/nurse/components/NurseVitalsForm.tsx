"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Heart,
  Activity,
  Droplet,
  Wind,
  Thermometer,
  Scale,
  Ruler,
  Moon,
  Dumbbell,
  GlassWater,
  Brain,
  Save,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  X,
  Loader2,
  User,
} from "lucide-react";

interface NurseVitalsFormProps {
  patientId: string;
  patientName: string;
  nurseId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface VitalsData {
  // Basic Vitals
  height_cm: string;
  weight_kg: string;

  // Cardiovascular
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  heart_rate: string;

  // Respiratory
  respiratory_rate: string;
  oxygen_saturation: string;

  // Metabolic
  blood_sugar: string;
  blood_sugar_type: string;
  temperature_celsius: string;

  // Cholesterol
  cholesterol_total: string;
  cholesterol_ldl: string;
  cholesterol_hdl: string;
  triglycerides: string;

  // Lifestyle
  sleep_hours: string;
  water_intake_ml: string;
  exercise_minutes: string;
  stress_level: string;

  // Notes
  notes: string;
  symptoms: string;
}

export default function NurseVitalsForm({
  patientId,
  patientName,
  nurseId,
  onClose,
  onSuccess,
}: NurseVitalsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "basic" | "cardio" | "metabolic" | "lifestyle"
  >("basic");

  const [formData, setFormData] = useState<VitalsData>({
    height_cm: "",
    weight_kg: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    respiratory_rate: "",
    oxygen_saturation: "",
    blood_sugar: "",
    blood_sugar_type: "fasting",
    temperature_celsius: "",
    cholesterol_total: "",
    cholesterol_ldl: "",
    cholesterol_hdl: "",
    triglycerides: "",
    sleep_hours: "",
    water_intake_ml: "",
    exercise_minutes: "",
    stress_level: "5",
    notes: "",
    symptoms: "",
  });

  // Load latest vitals on mount
  useEffect(() => {
    loadLatestVitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const loadLatestVitals = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_vitals")
        .select("*")
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        // Pre-fill form with latest values
        setFormData({
          height_cm: data.height_cm?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
          blood_pressure_systolic:
            data.blood_pressure_systolic?.toString() || "",
          blood_pressure_diastolic:
            data.blood_pressure_diastolic?.toString() || "",
          heart_rate: data.heart_rate?.toString() || "",
          respiratory_rate: data.respiratory_rate?.toString() || "",
          oxygen_saturation: data.oxygen_saturation?.toString() || "",
          blood_sugar: data.blood_sugar?.toString() || "",
          blood_sugar_type: data.blood_sugar_type || "fasting",
          temperature_celsius: data.temperature_celsius?.toString() || "",
          cholesterol_total: data.cholesterol_total?.toString() || "",
          cholesterol_ldl: data.cholesterol_ldl?.toString() || "",
          cholesterol_hdl: data.cholesterol_hdl?.toString() || "",
          triglycerides: data.triglycerides?.toString() || "",
          sleep_hours: data.sleep_hours?.toString() || "",
          water_intake_ml: data.water_intake_ml?.toString() || "",
          exercise_minutes: data.exercise_minutes?.toString() || "",
          stress_level: data.stress_level?.toString() || "5",
          notes: "",
          symptoms: "",
        });
      }
    } catch (err) {
      console.error("Error loading vitals:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert string values to appropriate types
      const vitalsData: Record<string, unknown> = {
        patient_id: patientId,
        recorded_by: "nurse",
      };

      // Only include non-empty fields
      if (formData.height_cm)
        vitalsData.height_cm = parseFloat(formData.height_cm);
      if (formData.weight_kg)
        vitalsData.weight_kg = parseFloat(formData.weight_kg);
      if (formData.blood_pressure_systolic)
        vitalsData.blood_pressure_systolic = parseInt(
          formData.blood_pressure_systolic,
        );
      if (formData.blood_pressure_diastolic)
        vitalsData.blood_pressure_diastolic = parseInt(
          formData.blood_pressure_diastolic,
        );
      if (formData.heart_rate)
        vitalsData.heart_rate = parseInt(formData.heart_rate);
      if (formData.respiratory_rate)
        vitalsData.respiratory_rate = parseInt(formData.respiratory_rate);
      if (formData.oxygen_saturation)
        vitalsData.oxygen_saturation = parseFloat(formData.oxygen_saturation);
      if (formData.blood_sugar) {
        vitalsData.blood_sugar = parseFloat(formData.blood_sugar);
        vitalsData.blood_sugar_type = formData.blood_sugar_type;
      }
      if (formData.temperature_celsius)
        vitalsData.temperature_celsius = parseFloat(
          formData.temperature_celsius,
        );
      if (formData.cholesterol_total)
        vitalsData.cholesterol_total = parseFloat(formData.cholesterol_total);
      if (formData.cholesterol_ldl)
        vitalsData.cholesterol_ldl = parseFloat(formData.cholesterol_ldl);
      if (formData.cholesterol_hdl)
        vitalsData.cholesterol_hdl = parseFloat(formData.cholesterol_hdl);
      if (formData.triglycerides)
        vitalsData.triglycerides = parseFloat(formData.triglycerides);
      if (formData.sleep_hours)
        vitalsData.sleep_hours = parseFloat(formData.sleep_hours);
      if (formData.water_intake_ml)
        vitalsData.water_intake_ml = parseInt(formData.water_intake_ml);
      if (formData.exercise_minutes)
        vitalsData.exercise_minutes = parseInt(formData.exercise_minutes);
      if (formData.stress_level)
        vitalsData.stress_level = parseInt(formData.stress_level);
      if (formData.notes) vitalsData.notes = formData.notes;
      if (formData.symptoms) vitalsData.symptoms = formData.symptoms;

      const { error: insertError } = await supabase
        .from("patient_vitals")
        .insert([vitalsData]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error("Error saving vitals:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to save vitals. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateBMI = () => {
    const height = parseFloat(formData.height_cm);
    const weight = parseFloat(formData.weight_kg);
    if (height > 0 && weight > 0) {
      const bmi = weight / ((height / 100) * (height / 100));
      return bmi.toFixed(1);
    }
    return null;
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Vitals Saved!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Vitals for {patientName} have been recorded successfully.
        </p>
      </div>
    );
  }

  const bmi = calculateBMI();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Record Vitals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3" />
              {patientName}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close form"
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1.5 mb-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
        {[
          { id: "basic", label: "Basic", icon: Scale },
          { id: "cardio", label: "Cardio", icon: Heart },
          { id: "metabolic", label: "Metabolic", icon: Droplet },
          { id: "lifestyle", label: "Lifestyle", icon: Dumbbell },
        ].map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() =>
                setActiveSection(
                  section.id as "basic" | "cardio" | "metabolic" | "lifestyle",
                )
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeSection === section.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {section.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Vitals Section */}
        {activeSection === "basic" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VitalInput
                icon={<Ruler className="w-5 h-5" />}
                label="Height (cm)"
                name="height_cm"
                value={formData.height_cm}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="170.5"
                color="blue"
              />
              <VitalInput
                icon={<Scale className="w-5 h-5" />}
                label="Weight (kg)"
                name="weight_kg"
                value={formData.weight_kg}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="70.5"
                color="purple"
              />
            </div>

            {bmi && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    BMI (Auto-calculated)
                  </span>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {bmi}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {parseFloat(bmi) < 18.5
                    ? "Underweight"
                    : parseFloat(bmi) < 25
                      ? "Normal"
                      : parseFloat(bmi) < 30
                        ? "Overweight"
                        : "Obese"}
                </p>
              </div>
            )}

            <VitalInput
              icon={<Thermometer className="w-5 h-5" />}
              label="Temperature (°C)"
              name="temperature_celsius"
              value={formData.temperature_celsius}
              onChange={handleChange}
              type="number"
              step="0.1"
              placeholder="36.5"
              color="red"
            />
          </div>
        )}

        {/* Cardiovascular Section */}
        {activeSection === "cardio" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <VitalInput
                icon={<Activity className="w-5 h-5" />}
                label="BP Systolic"
                name="blood_pressure_systolic"
                value={formData.blood_pressure_systolic}
                onChange={handleChange}
                type="number"
                placeholder="120"
                color="rose"
              />
              <VitalInput
                icon={<Activity className="w-5 h-5" />}
                label="BP Diastolic"
                name="blood_pressure_diastolic"
                value={formData.blood_pressure_diastolic}
                onChange={handleChange}
                type="number"
                placeholder="80"
                color="rose"
              />
            </div>

            <VitalInput
              icon={<Heart className="w-5 h-5" />}
              label="Heart Rate (bpm)"
              name="heart_rate"
              value={formData.heart_rate}
              onChange={handleChange}
              type="number"
              placeholder="72"
              color="red"
            />

            <div className="grid grid-cols-2 gap-4">
              <VitalInput
                icon={<Wind className="w-5 h-5" />}
                label="Respiratory Rate"
                name="respiratory_rate"
                value={formData.respiratory_rate}
                onChange={handleChange}
                type="number"
                placeholder="16"
                color="cyan"
              />
              <VitalInput
                icon={<Wind className="w-5 h-5" />}
                label="Oxygen Sat. (%)"
                name="oxygen_saturation"
                value={formData.oxygen_saturation}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="98"
                color="sky"
              />
            </div>
          </div>
        )}

        {/* Metabolic Section */}
        {activeSection === "metabolic" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <VitalInput
                icon={<Droplet className="w-5 h-5" />}
                label="Blood Sugar (mg/dL)"
                name="blood_sugar"
                value={formData.blood_sugar}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="100"
                color="amber"
              />
              <div className="space-y-2">
                <label
                  htmlFor="blood_sugar_type"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Type
                </label>
                <select
                  id="blood_sugar_type"
                  name="blood_sugar_type"
                  value={formData.blood_sugar_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                >
                  <option value="fasting">Fasting</option>
                  <option value="random">Random</option>
                  <option value="post_meal">Post Meal</option>
                  <option value="hba1c">HbA1c</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <VitalInput
                icon={<Droplet className="w-5 h-5" />}
                label="Total Cholesterol"
                name="cholesterol_total"
                value={formData.cholesterol_total}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="200"
                color="orange"
              />
              <VitalInput
                icon={<Droplet className="w-5 h-5" />}
                label="LDL (Bad)"
                name="cholesterol_ldl"
                value={formData.cholesterol_ldl}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="100"
                color="red"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <VitalInput
                icon={<Droplet className="w-5 h-5" />}
                label="HDL (Good)"
                name="cholesterol_hdl"
                value={formData.cholesterol_hdl}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="60"
                color="green"
              />
              <VitalInput
                icon={<Droplet className="w-5 h-5" />}
                label="Triglycerides"
                name="triglycerides"
                value={formData.triglycerides}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="150"
                color="yellow"
              />
            </div>
          </div>
        )}

        {/* Lifestyle Section */}
        {activeSection === "lifestyle" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <VitalInput
              icon={<Moon className="w-5 h-5" />}
              label="Sleep (hours)"
              name="sleep_hours"
              value={formData.sleep_hours}
              onChange={handleChange}
              type="number"
              step="0.5"
              placeholder="7.5"
              color="indigo"
            />

            <VitalInput
              icon={<GlassWater className="w-5 h-5" />}
              label="Water Intake (ml)"
              name="water_intake_ml"
              value={formData.water_intake_ml}
              onChange={handleChange}
              type="number"
              placeholder="2000"
              color="cyan"
            />

            <VitalInput
              icon={<Dumbbell className="w-5 h-5" />}
              label="Exercise (minutes)"
              name="exercise_minutes"
              value={formData.exercise_minutes}
              onChange={handleChange}
              type="number"
              placeholder="30"
              color="emerald"
            />

            <div className="space-y-2">
              <label
                htmlFor="stress_level"
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <Brain className="w-5 h-5 text-purple-500" />
                Stress Level (1-10)
              </label>
              <input
                type="range"
                id="stress_level"
                name="stress_level"
                min="1"
                max="10"
                value={formData.stress_level}
                onChange={handleChange}
                title="Stress Level"
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Low (1)</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {formData.stress_level}
                </span>
                <span>High (10)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Symptoms
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                placeholder="Any current symptoms or concerns..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes about the patient's health..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none text-sm"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Vitals
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper component for vital inputs
function VitalInput({
  icon,
  label,
  name,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
  color = "gray",
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  step?: string;
  placeholder?: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
    purple: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
    red: "text-red-500 bg-red-50 dark:bg-red-900/20",
    rose: "text-rose-500 bg-rose-50 dark:bg-rose-900/20",
    cyan: "text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20",
    sky: "text-sky-500 bg-sky-50 dark:bg-sky-900/20",
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
    green: "text-green-500 bg-green-50 dark:bg-green-900/20",
    yellow: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
  };

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span
          className={`p-1 rounded-lg ${colorClasses[color] || "text-slate-400 bg-slate-100"}`}
        >
          {icon}
        </span>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all text-sm"
      />
    </div>
  );
}

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
  height_cm: string;
  weight_kg: string;
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  heart_rate: string;
  respiratory_rate: string;
  oxygen_saturation: string;
  blood_sugar: string;
  blood_sugar_type: string;
  temperature_celsius: string;
  cholesterol_total: string;
  cholesterol_ldl: string;
  cholesterol_hdl: string;
  triglycerides: string;
  sleep_hours: string;
  water_intake_ml: string;
  exercise_minutes: string;
  stress_level: string;
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

  // Load latest vitals on mount to pre-fill
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
        setFormData({
          height_cm: data.height_cm?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
          blood_pressure_systolic: data.blood_pressure_systolic?.toString() || "",
          blood_pressure_diastolic: data.blood_pressure_diastolic?.toString() || "",
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
      const vitalsData: any = {
        patient_id: patientId,
        recorded_by: "nurse",
      };

      if (formData.height_cm) vitalsData.height_cm = parseFloat(formData.height_cm);
      if (formData.weight_kg) vitalsData.weight_kg = parseFloat(formData.weight_kg);
      if (formData.blood_pressure_systolic) vitalsData.blood_pressure_systolic = parseInt(formData.blood_pressure_systolic);
      if (formData.blood_pressure_diastolic) vitalsData.blood_pressure_diastolic = parseInt(formData.blood_pressure_diastolic);
      if (formData.heart_rate) vitalsData.heart_rate = parseInt(formData.heart_rate);
      if (formData.respiratory_rate) vitalsData.respiratory_rate = parseInt(formData.respiratory_rate);
      if (formData.oxygen_saturation) vitalsData.oxygen_saturation = parseFloat(formData.oxygen_saturation);
      if (formData.blood_sugar) {
        vitalsData.blood_sugar = parseFloat(formData.blood_sugar);
        vitalsData.blood_sugar_type = formData.blood_sugar_type;
      }
      if (formData.temperature_celsius) vitalsData.temperature_celsius = parseFloat(formData.temperature_celsius);
      if (formData.cholesterol_total) vitalsData.cholesterol_total = parseFloat(formData.cholesterol_total);
      if (formData.cholesterol_ldl) vitalsData.cholesterol_ldl = parseFloat(formData.cholesterol_ldl);
      if (formData.cholesterol_hdl) vitalsData.cholesterol_hdl = parseFloat(formData.cholesterol_hdl);
      if (formData.triglycerides) vitalsData.triglycerides = parseFloat(formData.triglycerides);
      if (formData.sleep_hours) vitalsData.sleep_hours = parseFloat(formData.sleep_hours);
      if (formData.water_intake_ml) vitalsData.water_intake_ml = parseInt(formData.water_intake_ml);
      if (formData.exercise_minutes) vitalsData.exercise_minutes = parseInt(formData.exercise_minutes);
      if (formData.stress_level) vitalsData.stress_level = parseInt(formData.stress_level);
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
    } catch (err: any) {
      console.error("Error saving vitals:", err);
      setError(err.message || "Failed to save vitals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Vitals Saved!
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Vitals for <span className="font-semibold">{patientName}</span> have been recorded successfully.
        </p>
      </div>
    );
  }

  const bmi = calculateBMI();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Record Vitals
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <User className="w-3 h-3" />
              Patient: <span className="font-semibold text-gray-700 dark:text-gray-300">{patientName}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          title="Close"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeSection === section.id
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
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
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    BMI (Auto-calculated)
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {bmi}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <select
                  name="blood_sugar_type"
                  value={formData.blood_sugar_type}
                  onChange={handleChange}
                  title="Blood sugar type"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
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
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Brain className="w-5 h-5 text-purple-500" />
                Stress Level (1-10)
              </label>
              <input
                type="range"
                name="stress_level"
                min="1"
                max="10"
                value={formData.stress_level}
                onChange={handleChange}
                title="Stress level"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
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
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Symptoms
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                placeholder="Any current symptoms or concerns reported by patient..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nurse Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Clinical observations and notes..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none"
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
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:shadow-xl hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
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
}: any) {
  const colorClasses: any = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    purple: "text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    red: "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    rose: "text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
    cyan: "text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800",
    sky: "text-sky-500 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800",
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    green: "text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    yellow: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <div className={`p-1 rounded ${colorClasses[color]}`}>{icon}</div>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
      />
    </div>
  );
}

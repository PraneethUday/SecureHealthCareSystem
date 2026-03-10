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
  TrendingUp,
  AlertTriangle,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
} from "lucide-react";
import VitalsForm from "./VitalsForm";

interface PatientVitalsViewerProps {
  patientId: string;
  onClose: () => void;
}

interface Vital {
  id: string;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  blood_sugar: number | null;
  blood_sugar_type: string | null;
  temperature_celsius: number | null;
  cholesterol_total: number | null;
  cholesterol_ldl: number | null;
  cholesterol_hdl: number | null;
  triglycerides: number | null;
  sleep_hours: number | null;
  water_intake_ml: number | null;
  exercise_minutes: number | null;
  stress_level: number | null;
  notes: string | null;
  symptoms: string | null;
  recorded_at: string;
  recorded_by: string;
}

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}

export default function PatientVitalsViewer({
  patientId,
  onClose,
}: PatientVitalsViewerProps) {
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddVitals, setShowAddVitals] = useState(false);

  useEffect(() => {
    loadVitals();
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const loadVitals = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_vitals")
        .select("*")
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setVitals(data || []);
    } catch (err) {
      console.error("Error loading vitals:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("vitals_alerts")
        .select("*")
        .eq("patient_id", patientId)
        .eq("is_acknowledged", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error("Error loading alerts:", err);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("vitals_alerts")
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
      loadAlerts();
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    }
  };

  const handleVitalsAdded = () => {
    setShowAddVitals(false);
    loadVitals();
  };

  if (showAddVitals) {
    return (
      <VitalsForm
        patientId={patientId}
        onClose={() => setShowAddVitals(false)}
        onSuccess={handleVitalsAdded}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const latestVital = vitals[0];

  if (!latestVital) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          No vitals recorded yet
        </p>
        <button
          onClick={() => setShowAddVitals(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Record Your First Vitals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-xl">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              My Health Vitals
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date(latestVital.recorded_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddVitals(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Health Alerts ({alerts.length})
          </h4>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex items-start justify-between ${
                alert.severity === "critical"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : alert.severity === "high"
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                    : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      alert.severity === "critical"
                        ? "text-red-600"
                        : alert.severity === "high"
                          ? "text-orange-600"
                          : "text-yellow-600"
                    }`}
                  />
                  <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                    {alert.alert_type.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      alert.severity === "critical"
                        ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200"
                        : alert.severity === "high"
                          ? "bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
                          : "bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="ml-4 px-3 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Latest Vitals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {latestVital.height_cm && (
          <VitalCard
            icon={<Ruler className="w-5 h-5" />}
            label="Height"
            value={`${latestVital.height_cm} cm`}
            color="blue"
          />
        )}
        {latestVital.weight_kg && (
          <VitalCard
            icon={<Scale className="w-5 h-5" />}
            label="Weight"
            value={`${latestVital.weight_kg} kg`}
            color="purple"
          />
        )}
        {latestVital.bmi && (
          <VitalCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="BMI"
            value={latestVital.bmi.toFixed(1)}
            color="indigo"
            status={
              latestVital.bmi < 18.5
                ? "Underweight"
                : latestVital.bmi < 25
                  ? "Normal"
                  : latestVital.bmi < 30
                    ? "Overweight"
                    : "Obese"
            }
          />
        )}
        {latestVital.blood_pressure_systolic &&
          latestVital.blood_pressure_diastolic && (
            <VitalCard
              icon={<Activity className="w-5 h-5" />}
              label="Blood Pressure"
              value={`${latestVital.blood_pressure_systolic}/${latestVital.blood_pressure_diastolic}`}
              unit="mmHg"
              color="rose"
              alert={
                latestVital.blood_pressure_systolic >= 140 ||
                latestVital.blood_pressure_diastolic >= 90
              }
            />
          )}
        {latestVital.heart_rate && (
          <VitalCard
            icon={<Heart className="w-5 h-5" />}
            label="Heart Rate"
            value={latestVital.heart_rate.toString()}
            unit="bpm"
            color="red"
            alert={latestVital.heart_rate > 100 || latestVital.heart_rate < 60}
          />
        )}
        {latestVital.respiratory_rate && (
          <VitalCard
            icon={<Wind className="w-5 h-5" />}
            label="Respiratory Rate"
            value={latestVital.respiratory_rate.toString()}
            unit="br/min"
            color="cyan"
          />
        )}
        {latestVital.oxygen_saturation && (
          <VitalCard
            icon={<Wind className="w-5 h-5" />}
            label="Oxygen Saturation"
            value={latestVital.oxygen_saturation.toFixed(1)}
            unit="%"
            color="sky"
            alert={latestVital.oxygen_saturation < 95}
          />
        )}
        {latestVital.temperature_celsius && (
          <VitalCard
            icon={<Thermometer className="w-5 h-5" />}
            label="Temperature"
            value={latestVital.temperature_celsius.toFixed(1)}
            unit="°C"
            color="orange"
            alert={latestVital.temperature_celsius >= 38}
          />
        )}
        {latestVital.blood_sugar && (
          <VitalCard
            icon={<Droplet className="w-5 h-5" />}
            label={`Blood Sugar (${latestVital.blood_sugar_type})`}
            value={latestVital.blood_sugar.toFixed(1)}
            unit="mg/dL"
            color="amber"
            alert={
              latestVital.blood_sugar_type === "fasting" &&
              latestVital.blood_sugar >= 126
            }
          />
        )}
        {latestVital.cholesterol_total && (
          <VitalCard
            icon={<Droplet className="w-5 h-5" />}
            label="Total Cholesterol"
            value={latestVital.cholesterol_total.toFixed(0)}
            unit="mg/dL"
            color="yellow"
          />
        )}
        {latestVital.sleep_hours && (
          <VitalCard
            icon={<Moon className="w-5 h-5" />}
            label="Sleep"
            value={latestVital.sleep_hours.toFixed(1)}
            unit="hours"
            color="indigo"
          />
        )}
        {latestVital.exercise_minutes && (
          <VitalCard
            icon={<Dumbbell className="w-5 h-5" />}
            label="Exercise"
            value={latestVital.exercise_minutes.toString()}
            unit="min"
            color="emerald"
          />
        )}
        {latestVital.water_intake_ml && (
          <VitalCard
            icon={<GlassWater className="w-5 h-5" />}
            label="Water Intake"
            value={(latestVital.water_intake_ml / 1000).toFixed(1)}
            unit="L"
            color="cyan"
          />
        )}
        {latestVital.stress_level && (
          <VitalCard
            icon={<Brain className="w-5 h-5" />}
            label="Stress Level"
            value={latestVital.stress_level.toString()}
            unit="/10"
            color="purple"
            alert={latestVital.stress_level >= 7}
          />
        )}
      </div>

      {/* Notes and Symptoms */}
      {(latestVital.symptoms || latestVital.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {latestVital.symptoms && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-2">
                Symptoms
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {latestVital.symptoms}
              </p>
            </div>
          )}
          {latestVital.notes && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                Notes
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {latestVital.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* History Toggle */}
      {vitals.length > 1 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            {showHistory ? "Hide" : "Show"} History ({vitals.length - 1}{" "}
            previous records)
            {showHistory ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showHistory && (
            <div className="mt-4 space-y-3">
              {vitals.slice(1).map((vital) => (
                <div
                  key={vital.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {new Date(vital.recorded_at).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      By: {vital.recorded_by}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                    {vital.blood_pressure_systolic && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          BP:
                        </span>{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {vital.blood_pressure_systolic}/
                          {vital.blood_pressure_diastolic}
                        </span>
                      </div>
                    )}
                    {vital.heart_rate && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          HR:
                        </span>{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {vital.heart_rate} bpm
                        </span>
                      </div>
                    )}
                    {vital.temperature_celsius && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Temp:
                        </span>{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {vital.temperature_celsius.toFixed(1)}°C
                        </span>
                      </div>
                    )}
                    {vital.oxygen_saturation && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          SpO2:
                        </span>{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {vital.oxygen_saturation.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {vital.weight_kg && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Weight:
                        </span>{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {vital.weight_kg} kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component for vital cards
function VitalCard({
  icon,
  label,
  value,
  unit,
  color = "gray",
  alert = false,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color?: string;
  alert?: boolean;
  status?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
    rose: "from-rose-500 to-rose-600",
    cyan: "from-cyan-500 to-cyan-600",
    sky: "from-sky-500 to-sky-600",
    amber: "from-amber-500 to-amber-600",
    orange: "from-orange-500 to-orange-600",
    yellow: "from-yellow-500 to-yellow-600",
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        alert
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-lg shadow-red-500/10"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color] || colorClasses.purple} text-white`}
        >
          {icon}
        </div>
        {alert && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
        {unit && (
          <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
        )}
      </p>
      {status && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {status}
        </p>
      )}
    </div>
  );
}

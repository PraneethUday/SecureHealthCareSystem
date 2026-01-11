import { UserRole, ThemeClasses } from "../types";
import {
  Heart,
  Shield,
  Clock,
  Users,
  CheckCircle,
  Award,
  HeartPulse,
} from "lucide-react";

interface InfoBannerProps {
  selectedRole: UserRole;
  themeClasses: ThemeClasses;
}

export default function InfoBanner({
  selectedRole,
  themeClasses,
}: InfoBannerProps) {
  const isPatient = selectedRole === "patient";

  /* ============================
     ROLE-BASED FEATURE CONTENT
     ============================ */

  const patientFeatures = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Role-Based Access Control",
      description: "Only authorized doctors can access your records",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: "Sensitive Medical Data",
      description: "Your health information is securely stored",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Secure Anytime Access",
      description: "View your records when needed with full protection",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Trusted Care Providers",
      description: "Access limited to verified healthcare professionals",
    },
  ];

  const staffFeatures = [
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Role-Based Authentication",
      description: "Access permissions based on your clinical role",
    },
    {
      icon: <HeartPulse className="w-5 h-5" />,
      title: "Authorized Patient Records",
      description: "View only assigned and permitted patient data",
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: "Clinical Data Integrity",
      description: "Accurate, auditable, and tamper-resistant records",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Compliance & Security",
      description: "HIPAA-aligned healthcare data protection",
    },
  ];

  const features = isPatient ? patientFeatures : staffFeatures;

  return (
    <div
      className={`flex lg:w-full h-full ${
        isPatient
          ? "bg-gradient-to-br from-red-600 via-rose-600 to-pink-600"
          : "bg-gradient-to-br from-gray-800 via-gray-900 to-black"
      } text-white p-8 flex-col justify-between transition-all duration-300`}
    >
      {/* ================= TOP SECTION ================= */}
      <div>
        {/* Logo & Platform Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Secure HealthCare</h1>
              <p className="text-white/80 text-xs">
                {isPatient
                  ? "Your Medical Data, Your Control"
                  : "Role-Based Secure Healthcare Platform"}
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-3 leading-tight">
            {isPatient
              ? "Secure Access to Your Medical Records"
              : "Secure Healthcare Data Management"}
          </h2>
          <p className="text-white/90 text-base">
            {isPatient
              ? "Your health records are protected using role-based access control, ensuring privacy and trusted medical care."
              : "Access patient data securely based on professional role, authorization level, and compliance policies."}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex-shrink-0 bg-white/20 rounded-lg p-1.5">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-base mb-0.5">
                  {feature.title}
                </h3>
                <p className="text-white/80 text-xs">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= BOTTOM STATS ================= */}
      <div className="mt-8 pt-6 border-t border-white/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold mb-1">
              {isPatient ? "100%" : "RBAC"}
            </div>
            <div className="text-white/70 text-xs">
              {isPatient ? "Data Privacy" : "Access Control"}
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold mb-1">
              {isPatient ? "Encrypted" : "Audit Logs"}
            </div>
            <div className="text-white/70 text-xs">
              {isPatient ? "Medical Records" : "All Actions Tracked"}
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold mb-1">
              {isPatient ? "Trusted" : "HIPAA"}
            </div>
            <div className="text-white/70 text-xs">
              {isPatient ? "Healthcare System" : "Compliant"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

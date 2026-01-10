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

  const patientFeatures = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "24/7 Access",
      description: "View your records anytime, anywhere",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: "Personal Health",
      description: "Track your health journey",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Expert Care",
      description: "Connect with healthcare professionals",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure & Private",
      description: "Your data is encrypted and protected",
    },
  ];

  const staffFeatures = [
    {
      icon: <HeartPulse className="w-5 h-5" />,
      title: "Patient Management",
      description: "Efficient patient care coordination",
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Real-time Updates",
      description: "Instant access to patient records",
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: "Quality Care",
      description: "Tools for better patient outcomes",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security",
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
      {/* Top Section */}
      <div>
        {/* Logo and Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SecureHealthCare</h1>
              <p className="text-white/80 text-xs">
                {isPatient
                  ? "Your Health, Our Priority"
                  : "Professional Healthcare Platform"}
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-3 leading-tight">
            {isPatient
              ? "Welcome to Your Healthcare Portal"
              : "Healthcare Staff Portal"}
          </h2>
          <p className="text-white/90 text-base">
            {isPatient
              ? "Access your medical records, schedule appointments, and stay connected with your healthcare team."
              : "Secure access to patient management systems and healthcare resources."}
          </p>
        </div>

        {/* Features Grid */}
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

      {/* Bottom Section - Stats or Info */}
      <div className="mt-8 pt-6 border-t border-white/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold mb-1">
              {isPatient ? "50K+" : "500+"}
            </div>
            <div className="text-white/70 text-xs">
              {isPatient ? "Patients" : "Healthcare Staff"}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-1">
              {isPatient ? "24/7" : "99.9%"}
            </div>
            <div className="text-white/70 text-xs">
              {isPatient ? "Support" : "Uptime"}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-1">
              {isPatient ? "100%" : "HIPAA"}
            </div>
            <div className="text-white/70 text-xs">
              {isPatient ? "Secure" : "Compliant"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

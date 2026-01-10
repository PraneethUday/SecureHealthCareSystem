import { Shield, Lock, Eye, UserCheck, HeartPulse } from "lucide-react";

export default function RegisterInfoBanner() {
  const features = [
    {
      icon: <Shield className="w-4 h-4" />,
      title: "Role-Based Security",
      description: "Only authorized professionals access your data",
    },
    {
      icon: <Lock className="w-4 h-4" />,
      title: "Your Data, Your Control",
      description: "You decide who views your information",
    },
    {
      icon: <Eye className="w-4 h-4" />,
      title: "Complete Transparency",
      description: "Track every access to your records",
    },
    {
      icon: <UserCheck className="w-4 h-4" />,
      title: "Verified Healthcare Staff",
      description: "All staff are verified professionals",
    },
  ];

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 text-white p-6 flex-col justify-between h-screen overflow-hidden">
      {/* Top Section */}
      <div>
        {/* Logo and Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SecureHealthCare</h1>
              <p className="text-white/80 text-xs">Your Health, Your Privacy</p>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 leading-tight">
            Your Medical Data Matters
          </h2>
          <p className="text-white/90 text-sm leading-relaxed">
            Our role-based authentication ensures only authorized healthcare
            professionals you approve can access your medical records.
          </p>
        </div>

        {/* Why Your Data is Important */}
        <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <h3 className="font-semibold text-base mb-2">Why Security Matters</h3>
          <ul className="space-y-1.5 text-xs text-white/90">
            <li className="flex items-start gap-2">
              <span className="text-white/60 mt-0.5">•</span>
              <span>Privacy protection for your health information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white/60 mt-0.5">•</span>
              <span>Identity safety with sensitive personal details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white/60 mt-0.5">•</span>
              <span>Better care through secure data sharing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white/60 mt-0.5">•</span>
              <span>Legal right to control your health data</span>
            </li>
          </ul>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-2.5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-2.5 bg-white/10 backdrop-blur-sm rounded-lg p-2.5 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex-shrink-0 bg-white/20 rounded-lg p-1.5">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">
                  {feature.title}
                </h3>
                <p className="text-white/80 text-xs">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section - Trust Indicators */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold mb-0.5">HIPAA</div>
            <div className="text-white/70 text-xs">Compliant</div>
          </div>
          <div>
            <div className="text-xl font-bold mb-0.5">256-bit</div>
            <div className="text-white/70 text-xs">Encryption</div>
          </div>
          <div>
            <div className="text-xl font-bold mb-0.5">24/7</div>
            <div className="text-white/70 text-xs">Monitoring</div>
          </div>
        </div>
      </div>
    </div>
  );
}

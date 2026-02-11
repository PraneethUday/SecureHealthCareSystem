'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Shield, Users, Activity, Calendar, MessageSquare, Video } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Dynamic import for Threads component (client-side only)
const Threads = dynamic(() => import("@/components/Threads"), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gradient-to-br from-red-900 to-black" />
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-red-200/50 dark:border-red-900/30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                SecureHealthCare
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#about" className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition">
                About
              </a>
              <a href="#features" className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition">
                Features
              </a>
              <ThemeToggle />
              <Link
                href="/login"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition inline-flex items-center space-x-2"
              >
                <span>Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Threads Background */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Threads Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-black dark:from-black dark:via-red-950 dark:to-gray-950">
          <Threads
            color={[0.9, 0.2, 0.2]}
            amplitude={1.2}
            distance={0.3}
            enableMouseInteraction
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Secure Healthcare Management
            <span className="block text-red-300 mt-2">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto drop-shadow">
            A comprehensive healthcare platform designed for doctors, nurses, and patients.
            Manage appointments, medical records, prescriptions, and telemedicine securely in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center space-x-2 shadow-lg hover:shadow-red-500/30 hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#about"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:border-red-400 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to manage healthcare efficiently
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="h-10 w-10 text-red-600" />}
              title="Appointment Management"
              description="Schedule, manage, and track patient appointments with ease. Real-time availability and automated reminders."
            />
            <FeatureCard
              icon={<Activity className="h-10 w-10 text-red-500" />}
              title="Medical Records"
              description="Secure electronic health records with complete patient history, vitals tracking, and medical documentation."
            />
            <FeatureCard
              icon={<Video className="h-10 w-10 text-red-700" />}
              title="Telemedicine"
              description="Integrated video consultations with WebRTC technology for seamless virtual appointments."
            />
            <FeatureCard
              icon={<MessageSquare className="h-10 w-10 text-red-400" />}
              title="AI Chatbot"
              description="Intelligent chatbot powered by OpenAI to assist with common healthcare queries and support."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-red-600" />}
              title="Secure & Compliant"
              description="Enterprise-grade security with role-based access control, audit logging, and data encryption."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-red-500" />}
              title="Multi-Role Support"
              description="Tailored interfaces for doctors, nurses, and patients with appropriate access levels."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                About SecureHealthCare System
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                SecureHealthCare System is a modern, comprehensive healthcare management platform
                designed to streamline medical operations and improve patient care delivery.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Built with cutting-edge technology and security best practices, our system provides
                healthcare professionals with the tools they need to focus on what matters most - patient care.
              </p>
              <div className="space-y-4">
                <AboutFeature
                  title="Role-Based Access Control"
                  description="Secure authentication with different access levels for doctors, nurses, and patients."
                />
                <AboutFeature
                  title="Complete Medical Workflow"
                  description="From appointments to prescriptions, manage the entire patient journey in one platform."
                />
                <AboutFeature
                  title="Real-Time Collaboration"
                  description="Enable seamless communication between healthcare providers with instant updates."
                />
                <AboutFeature
                  title="Comprehensive Audit Logs"
                  description="Full transparency with detailed logging of all system activities for compliance."
                />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Key Capabilities
              </h3>
              <ul className="space-y-4">
                <Capability text="Patient appointment scheduling and management" />
                <Capability text="Electronic health records (EHR) system" />
                <Capability text="Prescription and pharmacy management" />
                <Capability text="Vital signs tracking and monitoring" />
                <Capability text="Medical report generation (PDF)" />
                <Capability text="Telemedicine video consultations" />
                <Capability text="AI-powered chatbot support" />
                <Capability text="Nurse assignment and coordination" />
                <Capability text="Account security with lockout protection" />
                <Capability text="Email notifications for appointments" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-700 via-red-600 to-red-700 dark:from-red-900 dark:via-red-800 dark:to-red-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Healthcare Management?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join healthcare professionals using SecureHealthCare to deliver better patient care.
          </p>
          <Link
            href="/login"
            className="bg-white hover:bg-gray-100 text-red-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 inline-flex items-center space-x-2 shadow-lg hover:shadow-white/30 hover:scale-105"
          >
            <span>Access Portal</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-red-500" />
                <span className="text-lg font-bold text-white">SecureHealthCare</span>
              </div>
              <p className="text-gray-400">
                Empowering healthcare providers with secure, efficient, and comprehensive management tools.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-red-400 transition">Features</a></li>
                <li><a href="#about" className="hover:text-red-400 transition">About</a></li>
                <li><Link href="/login" className="hover:text-red-400 transition">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                For support and inquiries, please contact your system administrator.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} SecureHealthCare System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function AboutFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-red-600 flex items-center justify-center mt-1">
        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </div>
  );
}

function Capability({ text }: { text: string }) {
  return (
    <li className="flex items-center space-x-3">
      <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="text-gray-700 dark:text-gray-300">{text}</span>
    </li>
  );
}

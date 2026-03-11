"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Video,
  MapPin,
} from "lucide-react";
import { AppointmentWithDetails } from "@/lib/database.types";

interface AppointmentsCalendarProps {
  appointments: AppointmentWithDetails[];
}

export default function AppointmentsCalendar({
  appointments,
}: AppointmentsCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Today's stats
  const today = new Date();
  const todayStr = today.toDateString();

  const todayStats = useMemo(() => {
    const todayAppts = appointments.filter(
      (apt) => new Date(apt.appointment_date).toDateString() === todayStr,
    );
    return {
      total: todayAppts.length,
      completed: todayAppts.filter((apt) => apt.status === "completed").length,
      cancelled: todayAppts.filter((apt) => apt.status === "cancelled").length,
      scheduled: todayAppts.filter((apt) => apt.status === "scheduled").length,
    };
  }, [appointments, todayStr]);

  // Get appointments grouped by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, AppointmentWithDetails[]> = {};
    appointments.forEach((apt) => {
      const dateKey = new Date(apt.appointment_date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });
    return grouped;
  }, [appointments]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAppointmentCount = (date: Date) => {
    const dateKey = date.toDateString();
    return appointmentsByDate[dateKey]?.length || 0;
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-slate-50 dark:bg-slate-800/50";
    if (count === 1) return "bg-blue-100 dark:bg-blue-900/30";
    if (count === 2) return "bg-blue-200 dark:bg-blue-800/40";
    if (count === 3) return "bg-blue-300 dark:bg-blue-700/50";
    if (count <= 5) return "bg-blue-400 dark:bg-blue-600/60";
    return "bg-blue-500 dark:bg-blue-500/70";
  };

  const getTextColor = (count: number) => {
    if (count >= 4) return "text-white";
    return "text-slate-700 dark:text-slate-200";
  };

  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toDateString();
    return appointmentsByDate[dateKey] || [];
  }, [selectedDate, appointmentsByDate]);

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case "scheduled":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <>
      {/* Card Preview */}
      <div
        onClick={() => setIsOpen(true)}
        className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 transition-colors"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {todayStats.total}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Today&apos;s Schedule
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-xs mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600 dark:text-slate-400">
              {todayStats.completed} done
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-slate-600 dark:text-slate-400">
              {todayStats.cancelled} cancelled
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View Calendar
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* Full Calendar Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setSelectedDate(null);
            }}
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Appointments Calendar
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {appointments.length} total appointments
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedDate(null);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendar */}
                <div className="flex-1">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={prevMonth}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {currentMonth.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                      <button
                        onClick={goToToday}
                        className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-lg transition-colors"
                      >
                        Today
                      </button>
                    </div>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                    {/* Week Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {weekDays.map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {days.map((date, index) => {
                        if (!date) {
                          return (
                            <div key={`empty-${index}`} className="h-12" />
                          );
                        }

                        const count = getAppointmentCount(date);
                        const isToday =
                          date.toDateString() === today.toDateString();
                        const isSelected =
                          selectedDate &&
                          date.toDateString() === selectedDate.toDateString();

                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => setSelectedDate(date)}
                            className={`h-12 rounded-lg flex flex-col items-center justify-center transition-colors ${getHeatmapColor(count)} ${getTextColor(count)} ${
                              isSelected
                                ? "ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900"
                                : ""
                            } ${isToday ? "ring-2 ring-purple-300 dark:ring-purple-700" : ""} hover:opacity-80`}
                          >
                            <span
                              className={`text-sm font-medium leading-none ${isToday ? "font-bold" : ""}`}
                            >
                              {date.getDate()}
                            </span>
                            {count > 0 && (
                              <span
                                className={`text-[10px] leading-none ${count >= 4 ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Less</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700" />
                        <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30" />
                        <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-800/40" />
                        <div className="w-4 h-4 rounded bg-blue-300 dark:bg-blue-700/50" />
                        <div className="w-4 h-4 rounded bg-blue-400 dark:bg-blue-600/60" />
                        <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-500/70" />
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </div>

                {/* Selected Date Details */}
                <div className="lg:w-80 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  {selectedDate ? (
                    <>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        {selectedDateAppointments.length} appointment
                        {selectedDateAppointments.length !== 1 ? "s" : ""}
                      </p>

                      {selectedDateAppointments.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            No appointments scheduled
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                          {selectedDateAppointments
                            .sort((a, b) =>
                              a.appointment_time.localeCompare(
                                b.appointment_time,
                              ),
                            )
                            .map((apt) => (
                              <div
                                key={apt.id}
                                className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                      {apt.patient_name?.charAt(0) || "P"}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm text-slate-900 dark:text-white">
                                        {apt.patient_name || "Patient"}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatTime(apt.appointment_time)}
                                      </p>
                                    </div>
                                  </div>
                                  {getStatusBadge(apt.status)}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1">
                                    {apt.is_telemedicine ? (
                                      <>
                                        <Video className="w-3 h-3" />
                                        Video
                                      </>
                                    ) : (
                                      <>
                                        <MapPin className="w-3 h-3" />
                                        In-person
                                      </>
                                    )}
                                  </span>
                                  {apt.hospital_name && (
                                    <span className="truncate">
                                      {apt.hospital_name}
                                    </span>
                                  )}
                                </div>

                                {apt.reason && (
                                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded px-2 py-1">
                                    {apt.reason}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Select a date
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Click on any date to view appointments
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

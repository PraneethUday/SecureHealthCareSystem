"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Pill, AlertCircle } from "lucide-react";
import { searchPrescriptionsForPharmacy } from "@/lib/prescriptions";
import { PrescriptionCard } from "./PrescriptionCard";

interface PharmacyManagerProps {
  staffId: string;
}

export function PharmacyManager({ staffId }: PharmacyManagerProps) {
  const [searchType, setSearchType] = useState<"id" | "name">("id");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed" | "discontinued"
  >("active");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim() && statusFilter === "all") {
      setError("Please enter a patient ID or name to search");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const filters: any = {
        status: statusFilter,
      };

      if (searchType === "id") {
        filters.patientId = searchValue.trim();
      } else {
        filters.patientName = searchValue.trim();
      }

      const result = await searchPrescriptionsForPharmacy(filters);

      if (result.success && result.data) {
        setPrescriptions(result.data);
        if (result.data.length === 0) {
          setError("No prescriptions found matching your search criteria");
        }
      } else {
        setError(result.error || "Failed to search prescriptions");
        setPrescriptions([]);
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError("An error occurred while searching");
      setPrescriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleStatusUpdate = () => {
    handleSearch();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-violet-50 dark:bg-violet-900/30 rounded-xl">
          <Pill className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Pharmacy Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Search and dispense prescriptions
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        {/* Search Type Toggle */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setSearchType("id")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === "id"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Search by Patient ID
          </button>
          <button
            onClick={() => setSearchType("name")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === "name"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Search by Patient Name
          </button>
        </div>

        {/* Search Input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                searchType === "id"
                  ? "Enter patient ID (e.g., P001)"
                  : "Enter patient name"
              }
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500 transition-all appearance-none cursor-pointer"
              aria-label="Filter prescriptions by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 text-white text-sm rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Search Hint */}
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {searchType === "id"
            ? "Enter the patient ID to find all prescriptions for that patient"
            : "Enter the patient's first or last name to search"}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-300 text-sm">Error</p>
            <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {hasSearched && !error && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Search Results
            {!isLoading && (
              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                ({prescriptions.length} prescription
                {prescriptions.length !== 1 ? "s" : ""} found)
              </span>
            )}
          </h3>

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading prescriptions...</p>
            </div>
          ) : prescriptions.length > 0 ? (
            <div className="space-y-3">
              {prescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  staffId={staffId}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Pill className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                No Prescriptions Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try adjusting your search criteria or status filter
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-12 px-6 text-center">
          <Pill className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            Start Searching for Prescriptions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Use the search bar above to find patient prescriptions by ID or
            name. You can filter by prescription status to find active,
            completed, or discontinued prescriptions.
          </p>
        </div>
      )}
    </div>
  );
}

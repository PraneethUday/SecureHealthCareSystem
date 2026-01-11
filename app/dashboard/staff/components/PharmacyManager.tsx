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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "discontinued">("active");
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
    // Refresh the search results after a status update
    handleSearch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-full p-3">
          <Pill className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pharmacy Management</h2>
          <p className="text-sm text-gray-600">Search and dispense prescriptions</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-4">
          {/* Search Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSearchType("id")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                searchType === "id"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Search by Patient ID
            </button>
            <button
              onClick={() => setSearchType("name")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                searchType === "name"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Search by Patient Name
            </button>
          </div>

          {/* Search Input */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white cursor-pointer"
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
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>

          {/* Search Hint */}
          <p className="text-sm text-gray-500">
            {searchType === "id"
              ? "Enter the patient ID to find all prescriptions for that patient"
              : "Enter the patient's first or last name to search"}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {hasSearched && !error && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results
              {!isLoading && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""} found)
                </span>
              )}
            </h3>
          </div>

          {/* Results List */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading prescriptions...</p>
            </div>
          ) : prescriptions.length > 0 ? (
            <div className="space-y-4">
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
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Prescriptions Found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or status filter
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-12 text-center">
          <Pill className="w-20 h-20 text-purple-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Start Searching for Prescriptions
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Use the search bar above to find patient prescriptions by ID or name.
            You can filter by prescription status to find active, completed, or discontinued prescriptions.
          </p>
        </div>
      )}
    </div>
  );
}

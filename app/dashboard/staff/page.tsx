import { supabaseServer } from '@/lib/supabase';

export default async function StaffPrescriptionsPage() {
  // Fetch all prescriptions with patient, doctor, appointment info
  const { data: prescriptions, error } = await supabaseServer
    .from('prescriptions')
    .select(`
      id, notes, created_at,
      patient:patient_id ( full_name ),
      doctor:doctor_id ( full_name ),
      appointment:appointment_id ( date ),
      prescription_items (
        medicine_name, dosage, frequency, duration, instructions
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return <div className="text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Active Prescriptions</h1>
      <div className="space-y-6">
        {prescriptions?.map((rx: any) => (
          <div key={rx.id} className="bg-white rounded shadow p-4">
            <div className="mb-2">
              <span className="font-semibold">Patient:</span> {rx.patient?.full_name}
              <span className="ml-4 font-semibold">Doctor:</span> {rx.doctor?.full_name}
              <span className="ml-4 font-semibold">Date:</span> {rx.appointment?.date?.slice(0,10)}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Notes:</span> {rx.notes}
            </div>
            <div>
              <span className="font-semibold">Medicines:</span>
              <ul className="list-disc ml-6">
                {rx.prescription_items?.map((item: any, idx: number) => (
                  <li key={idx}>
                    <span className="font-semibold">{item.medicine_name}</span> — {item.dosage}, {item.frequency}, {item.duration}
                    {item.instructions && <span> ({item.instructions})</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        {(!prescriptions || prescriptions.length === 0) && (
          <div className="text-gray-500">No prescriptions found.</div>
        )}
      </div>
    </div>
  );
}


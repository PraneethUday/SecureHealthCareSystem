'use client';
import { useState } from 'react';
import { createPrescription } from '@/lib/prescriptions';

export default function PrescribeModal({ appointment, onClose }: {
  appointment: { id: string, patient_id: string, doctor_id: string },
  onClose: () => void
}) {
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemChange = (idx: number, field: string, value: string) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems([...items, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createPrescription({
        appointment_id: appointment.id,
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        notes,
        items,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Create Prescription</h2>
        <textarea
          className="w-full border p-2 mb-4"
          placeholder="Notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <div>
          <h3 className="font-semibold mb-2">Medicines</h3>
          {items.map((item, idx) => (
            <div key={idx} className="mb-2 border p-2 rounded bg-gray-50">
              <input
                className="border p-1 mr-2"
                placeholder="Medicine Name"
                value={item.medicine_name}
                onChange={e => handleItemChange(idx, 'medicine_name', e.target.value)}
                required
              />
              <input
                className="border p-1 mr-2"
                placeholder="Dosage"
                value={item.dosage}
                onChange={e => handleItemChange(idx, 'dosage', e.target.value)}
                required
              />
              <input
                className="border p-1 mr-2"
                placeholder="Frequency"
                value={item.frequency}
                onChange={e => handleItemChange(idx, 'frequency', e.target.value)}
                required
              />
              <input
                className="border p-1 mr-2"
                placeholder="Duration"
                value={item.duration}
                onChange={e => handleItemChange(idx, 'duration', e.target.value)}
                required
              />
              <input
                className="border p-1"
                placeholder="Instructions"
                value={item.instructions}
                onChange={e => handleItemChange(idx, 'instructions', e.target.value)}
              />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} className="ml-2 text-red-500">Remove</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-blue-600 mt-2">+ Add Medicine</button>
        </div>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        <div className="flex justify-end mt-4">
          <button type="button" onClick={onClose} className="mr-2">Cancel</button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}

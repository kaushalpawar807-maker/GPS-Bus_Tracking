import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, DollarSign, CheckCircle } from 'lucide-react';

export default function ConductorDashboard() {
  const [passengerCount, setPassengerCount] = useState('');
  const [cashCollected, setCashCollected] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('conductor_reports')
        .insert([{
          conductor_id: user.id,
          bus_id: '00000000-0000-0000-0000-000000000000',
          passenger_count: parseInt(passengerCount),
          cash_collected: parseFloat(cashCollected),
        }]);

      if (error) throw error;

      setSuccess(true);
      setPassengerCount('');
      setCashCollected('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-800">Conductor Panel</h1>
          <p className="text-slate-500 mt-1">Submit daily trip reports</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-100">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-slate-100 p-4 rounded-xl">
              <Users className="w-8 h-8 text-slate-700" />
            </div>
          </div>

          <h2 className="text-xl font-medium text-slate-800 mb-6 text-center">Daily Trip Report</h2>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <p className="text-green-800 text-sm">Report submitted successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Passenger Count
              </label>
              <input
                type="number"
                value={passengerCount}
                onChange={(e) => setPassengerCount(e.target.value)}
                required
                min="0"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
                placeholder="Enter total passengers"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Cash Collected
              </label>
              <input
                type="number"
                step="0.01"
                value={cashCollected}
                onChange={(e) => setCashCollected(e.target.value)}
                required
                min="0"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
                placeholder="Enter amount in rupees"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>Note:</strong> In Phase-2, this panel will include features like:
            </p>
            <ul className="mt-2 text-sm text-slate-500 space-y-1 ml-4">
              <li>• Ticket verification with QR scanner</li>
              <li>• Real-time passenger tracking</li>
              <li>• Automatic cash reconciliation</li>
              <li>• Trip history and analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

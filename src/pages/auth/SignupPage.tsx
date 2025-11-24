import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'user' | 'admin' | 'driver' | 'conductor'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, role, fullName);
      navigate('/login');
    } catch (err) {
      // *** MODIFIED LOGGING FOR DETAILED DEBUGGING ***
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Full Signup Error:', err); // Print the full error object to console
      
      // Update the error message shown to the user to include the specific reason
      setError(`Failed to create account. Please try again. Reason: ${errorMessage.substring(0, 80)}...`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-slate-100 p-3 rounded-xl">
              <UserPlus className="w-8 h-8 text-slate-700" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-center text-slate-800 mb-2">
            Create Account
          </h1>
          <p className="text-center text-slate-500 mb-8">
            Join the community bus tracking system
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition bg-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="driver">Driver</option>
                <option value="conductor">Conductor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-slate-800 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
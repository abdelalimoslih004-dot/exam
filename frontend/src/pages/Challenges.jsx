import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const statusBadge = (status) => {
  if (status === 'passed') return 'bg-green-500/20 text-green-300 border-green-500/40';
  if (status === 'failed') return 'bg-red-500/20 text-red-300 border-red-500/40';
  return 'bg-blue-500/20 text-blue-200 border-blue-500/40';
};

const Challenges = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const authToken = token || localStorage.getItem('token');
        if (!authToken) {
          setError('Not authenticated. Please log in.');
          setLoading(false);
          return;
        }

        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/challenges`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setChallenges(res.data.challenges || []);
      } catch (err) {
        console.error('Error fetching challenges:', err);
        setError(err.response?.data?.error || 'Unable to load challenges');
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [token]);

  const formatDate = (value) => (value ? new Date(value).toLocaleString() : '--');

  return (
    <div className="min-h-screen bg-[#131722] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Challenges</h1>
            <p className="text-gray-400 text-sm">Track your evaluation status, equity, and outcomes.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 font-semibold"
            >
              Leaderboard
            </button>
          </div>
        </div>

        <div className="bg-[#1e222d] border border-[#2b2b43] rounded-xl p-4 shadow-lg">
          {loading ? (
            <p className="text-gray-400">Loading challenges...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : challenges.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p>No challenges found. Create one from your dashboard.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-[#2b2b43]">
                    <th className="py-3 pr-4 text-left">ID</th>
                    <th className="py-3 pr-4 text-left">Type</th>
                    <th className="py-3 pr-4 text-left">Initial</th>
                    <th className="py-3 pr-4 text-left">Equity</th>
                    <th className="py-3 pr-4 text-left">P&L</th>
                    <th className="py-3 pr-4 text-left">Status</th>
                    <th className="py-3 pr-4 text-left">Started</th>
                    <th className="py-3 pr-4 text-left">Ended</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((c) => (
                    <tr key={c.id} className="border-b border-[#2b2b43] last:border-none">
                      <td className="py-3 pr-4 text-white font-semibold">{c.id}</td>
                      <td className="py-3 pr-4 text-gray-200">{c.type}</td>
                      <td className="py-3 pr-4 text-gray-200">${c.initial_balance?.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-200">${c.current_balance?.toLocaleString()}</td>
                      <td className={`py-3 pr-4 font-semibold ${c.profit_loss >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                        {c.profit_loss >= 0 ? '+' : ''}{c.profit_loss?.toFixed(2)} ({c.profit_loss_pct?.toFixed(2)}%)
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-3 py-1 rounded-full text-xs border ${statusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-400">{formatDate(c.start_date)}</td>
                      <td className="py-3 pr-4 text-gray-400">{formatDate(c.end_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Challenges;

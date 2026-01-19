import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Leaderboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
    // Refresh leaderboard every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leaderboard');
      setLeaderboard(response.data.leaderboard);
      setError('');
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-400';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              🏆 Leaderboard
            </h1>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && leaderboard.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl text-gray-400">No traders on the leaderboard yet</p>
            <p className="text-gray-500 mt-2">Start trading to appear here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Leaderboard Table */}
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold">Rank</th>
                    <th className="px-6 py-4 text-left font-bold">Trader</th>
                    <th className="px-6 py-4 text-right font-bold">Total P&L</th>
                    <th className="px-6 py-4 text-center font-bold">Challenges</th>
                    <th className="px-6 py-4 text-center font-bold">Passed</th>
                    <th className="px-6 py-4 text-center font-bold">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {leaderboard.map((trader) => (
                    <tr
                      key={trader.user_id}
                      className="hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className={`text-2xl font-bold ${getRankColor(trader.rank)}`}>
                          {getRankIcon(trader.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                            {trader.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold">{trader.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`text-lg font-bold ${
                          trader.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trader.total_pnl >= 0 ? '+' : ''}
                          {formatCurrency(trader.total_pnl)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">
                          {trader.total_challenges}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-green-600/30 text-green-400 rounded-full text-sm">
                          {trader.passed_challenges}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-lg">{trader.win_rate}%</span>
                          <div className="w-24 bg-gray-700 rounded-full h-2 mt-1">
                            <div
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${trader.win_rate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200 text-sm">Top Trader</p>
                    <p className="text-2xl font-bold mt-1">
                      {leaderboard[0]?.username || 'N/A'}
                    </p>
                  </div>
                  <div className="text-5xl">👑</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm">Highest Profit</p>
                    <p className="text-2xl font-bold mt-1">
                      {leaderboard[0] ? formatCurrency(leaderboard[0].total_pnl) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-5xl">💰</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm">Total Traders</p>
                    <p className="text-2xl font-bold mt-1">
                      {leaderboard.length}
                    </p>
                  </div>
                  <div className="text-5xl">📊</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

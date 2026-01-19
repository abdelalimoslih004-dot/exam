import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPanel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    fetchChallenges();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchChallenges, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/challenges`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setChallenges(response.data.challenges);
      setError('');
    } catch (err) {
      console.error('Error fetching challenges:', err);
      if (err.response?.status === 403) {
        setError('Admin access required');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError('Failed to load challenges');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceStatus = async (challengeId, status) => {
    if (!window.confirm(`Are you sure you want to force ${status} for challenge #${challengeId}?`)) {
      return;
    }

    try {
      setProcessingId(challengeId);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `/api/admin/challenge/${challengeId}/force-status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update the challenge in the list
      setChallenges(challenges.map(c => 
        c.id === challengeId 
          ? { ...c, status, end_date: response.data.challenge.end_date }
          : c
      ));

      alert(`Challenge #${challengeId} has been ${status}`);
    } catch (err) {
      console.error('Error updating challenge:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-600 text-white';
      case 'PASSED':
        return 'bg-green-600 text-white';
      case 'FAILED':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const filteredChallenges = challenges.filter(c => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                Admin Panel
              </h1>
            </div>
            <button
              onClick={fetchChallenges}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors text-white font-semibold"
            >
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by username or challenge ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-colors duration-300"
              />
            </div>
            <div className="flex gap-2">
              {['ALL', 'ACTIVE', 'PASSED', 'FAILED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-400">No challenges found</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-xl">
                <div className="text-sm text-blue-200">Total Challenges</div>
                <div className="text-3xl font-bold mt-2">{challenges.length}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 shadow-xl">
                <div className="text-sm text-yellow-200">Active</div>
                <div className="text-3xl font-bold mt-2">
                  {challenges.filter(c => c.status === 'ACTIVE').length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-xl">
                <div className="text-sm text-green-200">Passed</div>
                <div className="text-3xl font-bold mt-2">
                  {challenges.filter(c => c.status === 'PASSED').length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 shadow-xl">
                <div className="text-sm text-red-200">Failed</div>
                <div className="text-3xl font-bold mt-2">
                  {challenges.filter(c => c.status === 'FAILED').length}
                </div>
              </div>
            </div>

            {/* Challenges Table */}
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
                    <tr>
                      <th className="px-4 py-4 text-left font-bold">ID</th>
                      <th className="px-4 py-4 text-left font-bold">Trader</th>
                      <th className="px-4 py-4 text-right font-bold">Initial</th>
                      <th className="px-4 py-4 text-right font-bold">Current</th>
                      <th className="px-4 py-4 text-right font-bold">P&L</th>
                      <th className="px-4 py-4 text-center font-bold">Status</th>
                      <th className="px-4 py-4 text-center font-bold">Start Date</th>
                      <th className="px-4 py-4 text-center font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredChallenges.map((challenge) => (
                      <tr
                        key={challenge.id}
                        className="hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <span className="font-mono text-sm">#{challenge.id}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                              {challenge.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold">{challenge.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          {formatCurrency(challenge.initial_balance)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          {formatCurrency(challenge.current_balance)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`font-bold ${
                            challenge.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {challenge.pnl >= 0 ? '+' : ''}
                            {formatCurrency(challenge.pnl)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(challenge.status)}`}>
                            {challenge.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-400">
                          {formatDate(challenge.start_date)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleForceStatus(challenge.id, 'PASSED')}
                              disabled={processingId === challenge.id || challenge.status === 'PASSED'}
                              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                                challenge.status === 'PASSED'
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {processingId === challenge.id ? 'Processing...' : 'Pass'}
                            </button>
                            <button
                              onClick={() => handleForceStatus(challenge.id, 'FAILED')}
                              disabled={processingId === challenge.id || challenge.status === 'FAILED'}
                              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                                challenge.status === 'FAILED'
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              {processingId === challenge.id ? 'Processing...' : 'Fail'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Showing results counter */}
            <div className="mt-4 text-center text-gray-400 text-sm">
              Showing {filteredChallenges.length} of {challenges.length} challenges
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

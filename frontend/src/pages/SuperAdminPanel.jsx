import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SuperAdminPanel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'challenges'
  
  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  
  // Challenges State
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [challengesError, setChallengesError] = useState('');
  
  const [processingId, setProcessingId] = useState(null);
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check if user is superadmin
    const token = localStorage.getItem('token');
    if (!token || user?.role !== 'superadmin') {
      navigate('/');
      return;
    }

    fetchUsers();
    fetchChallenges();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchUsers();
      fetchChallenges();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/superadmin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
      setUsersError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 403) {
        setUsersError('SuperAdmin access required');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setUsersError('Failed to load users');
      }
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/challenges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChallenges(response.data.challenges);
      setChallengesError('');
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setChallengesError('Failed to load challenges');
    } finally {
      setChallengesLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir changer le rôle en ${newRole}?`)) {
      return;
    }

    try {
      setProcessingId(userId);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `/api/superadmin/user/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      alert(`${response.data.message}`);
    } catch (err) {
      console.error('Error changing role:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`⚠️ ATTENTION: Supprimer l'utilisateur "${username}" et TOUTES ses données? Cette action est irréversible!`)) {
      return;
    }

    try {
      setProcessingId(userId);
      const token = localStorage.getItem('token');
      
      await axios.delete(
        `/api/superadmin/user/${userId}/delete`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(users.filter(u => u.id !== userId));
      alert(`User ${username} deleted`);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleForceStatus = async (challengeId, status) => {
    if (!window.confirm(`Forcer le statut ${status} pour le challenge #${challengeId}?`)) {
      return;
    }

    try {
      setProcessingId(challengeId);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `/api/admin/challenge/${challengeId}/force-status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChallenges(challenges.map(c => 
        c.id === challengeId 
          ? { ...c, status, end_date: response.data.challenge.end_date }
          : c
      ));

      alert(`Challenge #${challengeId} ${status}`);
    } catch (err) {
      console.error('Error updating challenge:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      superadmin: 'bg-gradient-to-r from-red-600 to-pink-600 text-white',
      admin: 'bg-gradient-to-r from-orange-600 to-red-600 text-white',
      trader: 'bg-blue-600 text-white'
    };
    return badges[role] || 'bg-gray-600 text-white';
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

  const filteredUsers = users.filter(u => {
    const matchesRole = filterRole === 'ALL' || u.role === filterRole.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toString().includes(searchTerm);
    return matchesRole && matchesSearch;
  });

  const filteredChallenges = challenges.filter(c => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-blue-900">
                SuperAdmin Panel
              </h1>
              <span className="px-3 py-1 bg-blue-900 rounded-full text-xs font-bold text-white">
                SUPERADMIN
              </span>
            </div>
            <button
              onClick={() => {
                fetchUsers();
                fetchChallenges();
              }}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors text-white font-semibold"
            >
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'challenges'
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Challenge Management
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={activeTab === 'users' ? "Rechercher utilisateur..." : "Rechercher challenge..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {activeTab === 'users' ? (
                <>
                  {['ALL', 'SUPERADMIN', 'ADMIN', 'TRADER'].map(role => (
                    <button
                      key={role}
                      onClick={() => setFilterRole(role)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        filterRole === role
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {['ALL', 'ACTIVE', 'PASSED', 'FAILED'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        filterStatus === status
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'users' ? (
          // Users Management
          usersLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : usersError ? (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
              <p className="text-red-400">{usersError}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-400">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <>
              {/* Users Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-xl">
                  <div className="text-sm text-blue-200">Total Utilisateurs</div>
                  <div className="text-3xl font-bold mt-2">{users.length}</div>
                </div>
                <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-xl p-6 shadow-xl">
                  <div className="text-sm text-red-200">SuperAdmins</div>
                  <div className="text-3xl font-bold mt-2">
                    {users.filter(u => u.role === 'superadmin').length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 shadow-xl">
                  <div className="text-sm text-orange-200">Admins</div>
                  <div className="text-3xl font-bold mt-2">
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 shadow-xl">
                  <div className="text-sm text-purple-200">Traders</div>
                  <div className="text-3xl font-bold mt-2">
                    {users.filter(u => u.role === 'trader').length}
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
                      <tr>
                        <th className="px-4 py-4 text-left font-bold">ID</th>
                        <th className="px-4 py-4 text-left font-bold">Username</th>
                        <th className="px-4 py-4 text-left font-bold">Email</th>
                        <th className="px-4 py-4 text-center font-bold">Rôle</th>
                        <th className="px-4 py-4 text-center font-bold">Challenges</th>
                        <th className="px-4 py-4 text-center font-bold">Créé le</th>
                        <th className="px-4 py-4 text-center font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map((usr) => (
                        <tr
                          key={usr.id}
                          className="hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm">#{usr.id}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${
                                usr.role === 'superadmin' ? 'from-red-500 to-pink-500' :
                                usr.role === 'admin' ? 'from-orange-500 to-red-500' :
                                'from-blue-500 to-purple-500'
                              } flex items-center justify-center text-xs font-bold`}>
                                {usr.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold">{usr.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-400">
                            {usr.email}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadge(usr.role)}`}>
                              {usr.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">
                              {usr.challenges_count}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-400">
                            {formatDate(usr.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center space-x-2">
                              <select
                                value={usr.role}
                                onChange={(e) => handleChangeRole(usr.id, e.target.value)}
                                disabled={processingId === usr.id || usr.id === user?.id}
                                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                <option value="trader">Trader</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">SuperAdmin</option>
                              </select>
                              <button
                                onClick={() => handleDeleteUser(usr.id, usr.username)}
                                disabled={processingId === usr.id || usr.id === user?.id}
                                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                                  usr.id === user?.id
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                              >
                                {processingId === usr.id ? 'Processing...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 text-center text-gray-400 text-sm">
                Affichage de {filteredUsers.length} sur {users.length} utilisateurs
              </div>
            </>
          )
        ) : (
          // Challenges Management (similar to AdminPanel)
          challengesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : challengesError ? (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
              <p className="text-red-400">{challengesError}</p>
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-400">Aucun challenge trouvé</p>
            </div>
          ) : (
            <>
              {/* Challenges Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-xl">
                  <div className="text-sm text-blue-200">Total Challenges</div>
                  <div className="text-3xl font-bold mt-2">{challenges.length}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 shadow-xl">
                  <div className="text-sm text-yellow-200">Actifs</div>
                  <div className="text-3xl font-bold mt-2">
                    {challenges.filter(c => c.status === 'ACTIVE').length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-xl">
                  <div className="text-sm text-green-200">Réussis</div>
                  <div className="text-3xl font-bold mt-2">
                    {challenges.filter(c => c.status === 'PASSED').length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 shadow-xl">
                  <div className="text-sm text-red-200">Échoués</div>
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
                        <th className="px-4 py-4 text-right font-bold">Actuel</th>
                        <th className="px-4 py-4 text-right font-bold">P&L</th>
                        <th className="px-4 py-4 text-center font-bold">Status</th>
                        <th className="px-4 py-4 text-center font-bold">Date début</th>
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

              <div className="mt-4 text-center text-gray-400 text-sm">
                Affichage de {filteredChallenges.length} sur {challenges.length} challenges
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default SuperAdminPanel;

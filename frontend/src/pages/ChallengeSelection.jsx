import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ChallengeSelection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableChallenges();
  }, []);

  const fetchAvailableChallenges = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/challenges/available', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setChallenges(response.data.challenge_types || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setError('Failed to load challenges');
      setLoading(false);
    }
  };

  const handleSelectChallenge = async (challengeType) => {
    try {
      setSelecting(challengeType);
      setError('');
      
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        navigate('/login');
        return;
      }

      // Create challenge
      const response = await axios.post(
        '/api/challenges/select',
        { challenge_type: challengeType },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const challenge = response.data.challenge;

      // Start the challenge immediately
      await axios.post(
        `/api/challenges/${challenge.id}/start`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error selecting challenge:', error);
      setError(error.response?.data?.error || 'Failed to select challenge');
      setSelecting(null);
    }
  };

  const getChallengeGradient = (type) => {
    switch (type) {
      case 'Starter':
        return 'from-green-600 to-green-800';
      case 'Pro':
        return 'from-blue-600 to-blue-800';
      case 'Elite':
        return 'from-purple-600 to-purple-800';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  const getChallengeIcon = (type) => {
    switch (type) {
      case 'Starter':
        return '🌱';
      case 'Pro':
        return '⚡';
      case 'Elite':
        return '👑';
      default:
        return '📊';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Select Your Challenge
          </h1>
          <p className="text-gray-400 text-lg">
            Choose a challenge that matches your trading experience and start your journey to success
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Challenge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {challenges.map((challenge) => (
            <div
              key={challenge.type}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Card Header with Gradient */}
              <div className={`bg-gradient-to-r ${getChallengeGradient(challenge.type)} p-6 text-center`}>
                <div className="text-5xl mb-3">{getChallengeIcon(challenge.type)}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{challenge.type}</h3>
                <div className="text-3xl font-bold text-white">
                  {challenge.initial_balance.toLocaleString()} DH
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <p className="text-gray-300 mb-6 min-h-[3rem]">{challenge.description}</p>

                {/* Challenge Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Daily Loss Limit:</span>
                    <span className="text-white font-semibold">{challenge.daily_loss_limit_pct}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Total Loss Limit:</span>
                    <span className="text-white font-semibold">{challenge.total_loss_limit_pct}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Profit Target:</span>
                    <span className="text-green-400 font-semibold">{challenge.profit_target_pct}%</span>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => handleSelectChallenge(challenge.type)}
                  disabled={selecting === challenge.type}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    selecting === challenge.type
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r ' + getChallengeGradient(challenge.type) + ' text-white hover:opacity-90'
                  }`}
                >
                  {selecting === challenge.type ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Selecting...
                    </span>
                  ) : (
                    'Select Challenge'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Dashboard Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeSelection;

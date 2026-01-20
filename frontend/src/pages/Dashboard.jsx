import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chat from '../components/Chat';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, token, isAuthenticated } = useAuth();
  const chartContainerRef = useRef();

  const [symbol, setSymbol] = useState('BTCUSD');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [symbolType, setSymbolType] = useState('crypto');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [aiSignal, setAiSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNuke, setShowNuke] = useState(false);
  const [balance, setBalance] = useState(5000);
  const [trades, setTrades] = useState([]);
  const [activeTrade, setActiveTrade] = useState(null);
  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 });
  const [chatOpen, setChatOpen] = useState(false);
  const [username, setUsername] = useState(user?.username || 'Trader');
  const [challengeId, setChallengeId] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [showTradeHistory, setShowTradeHistory] = useState(false);
  const [selectedTab, setSelectedTab] = useState('trading');
  const [marketStats, setMarketStats] = useState({
    volume24h: 0,
    high24h: 0,
    low24h: 0,
    change24h: 0,
  });

  const AVAILABLE_SYMBOLS = [
    { value: 'BTC', label: 'Bitcoin (BTC)', type: 'crypto', tvSymbol: 'BTCUSD' },
    { value: 'ETH', label: 'Ethereum (ETH)', type: 'crypto', tvSymbol: 'ETHUSD' },
    { value: 'IAM', label: 'Maroc Telecom (IAM)', type: 'bvc', tvSymbol: 'IAM' },
    { value: 'ATW', label: 'Attijariwafa Bank (ATW)', type: 'bvc', tvSymbol: 'ATW' },
    { value: 'LHM', label: 'LafargeHolcim (LHM)', type: 'bvc', tvSymbol: 'LHM' },
    { value: 'SMI', label: 'SMI (SMI)', type: 'bvc', tvSymbol: 'SMI' }
  ];

  // Handle symbol change
  const handleSymbolChange = (newSymbol) => {
    const symbolInfo = AVAILABLE_SYMBOLS.find(s => s.value === newSymbol);
    if (symbolInfo) {
      setSelectedSymbol(newSymbol);
      setSymbolType(symbolInfo.type);
      setSymbol(symbolInfo.tvSymbol);
      setCurrentPrice(null);
    }
  };

  // Fetch user's active challenge on mount
  useEffect(() => {
    const fetchActiveChallenge = async () => {
      try {
        const authToken = token || localStorage.getItem('token');
        if (!authToken) return;

        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/challenges`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        const challenges = response.data.challenges || [];
        console.log('All challenges:', challenges);
        const activeChallengeData = challenges.find(c => c.status === 'active');

        if (activeChallengeData) {
          setChallengeId(activeChallengeData.id);
          setBalance(activeChallengeData.current_balance);
          setActiveChallenge(activeChallengeData);
          console.log('✅ Active challenge loaded - ID:', activeChallengeData.id, 'Balance:', activeChallengeData.current_balance);
        } else {
          console.warn('⚠️ No active challenge found!');
          setActiveChallenge(null);
          console.log('💡 Tip: Go to Challenges page to start a new challenge');
        }
      } catch (error) {
        console.error('❌ Error fetching challenges:', error);
      }
    };

    fetchActiveChallenge();
  }, [token]);

  // Fetch user's trade history
  useEffect(() => {
    const fetchTradeHistory = async () => {
      try {
        const authToken = token || localStorage.getItem('token');
        if (!authToken) return;

        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/trades`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        const tradesData = response.data.trades || [];

        const formattedTrades = tradesData.map(t => ({
          id: t.id,
          type: t.type.toUpperCase(),
          symbol: t.symbol,
          entryPrice: t.entry_price || t.price,
          exitPrice: t.exit_price || t.price,
          quantity: t.quantity,
          pnl: t.pnl,
          closedAt: t.closed_at,
          timestamp: t.opened_at
        }));

        setTrades(formattedTrades);
        console.log('Trade history loaded:', formattedTrades.length, 'trades');
      } catch (error) {
        console.error('Error fetching trade history:', error);
      }
    };

    fetchTradeHistory();
  }, [token]);

  // Map symbols to TradingView format
  const getTradingViewSymbol = (sym) => {
    const symbolMap = {
      'BTCUSD': 'BINANCE:BTCUSDT',
      'ETHUSD': 'BINANCE:ETHUSDT',
      'IAM': 'CASABLANCA:IAM',
      'ATW': 'CASABLANCA:ATW',
      'LHM': 'CASABLANCA:LHM',
      'SMI': 'CASABLANCA:SMI'
    };
    return symbolMap[sym] || 'BINANCE:BTCUSDT';
  };

  // Load TradingView widget
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = '';

    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => initWidget();
      document.body.appendChild(script);
    } else {
      initWidget();
    }

    function initWidget() {
      new window.TradingView.widget({
        autosize: true,
        symbol: getTradingViewSymbol(symbol),
        interval: '15',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#1a1d27',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: true,
        container_id: chartContainerRef.current.id,
        studies: [
          'Volume@tv-basicstudies',
          'MASimple@tv-basicstudies',
          'RSI@tv-basicstudies'
        ],
        details: true,
        hotlist: true,
        calendar: false,
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        disabled_features: [],
        enabled_features: ['study_templates', 'use_localstorage_for_settings'],
        overrides: {
          'mainSeriesProperties.candleStyle.upColor': '#10b981',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
        }
      });
    }
  }, [symbol]);

  // Fetch real-time price data from our backend
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        let response;
        if (symbolType === 'crypto') {
          response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/crypto/${selectedSymbol}`);
        } else if (symbolType === 'bvc') {
          response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bvc/${selectedSymbol}`);
        } else {
          console.error('Unknown symbol type:', symbolType);
          return;
        }

        const data = response.data;
        const newPrice = data.price;

        setCurrentPrice((prevPrice) => {
          if (prevPrice !== null && newPrice !== prevPrice) {
            setIsLive(true);
            setTimeout(() => setIsLive(false), 1500);

            const changeValue = newPrice - prevPrice;
            const changePercent = ((changeValue / prevPrice) * 100);
            setPriceChange({ value: changeValue, percent: changePercent });

            // Update market stats
            setMarketStats(prev => ({
              ...prev,
              volume24h: data.volume || prev.volume24h,
              high24h: data.high_24h || prev.high24h,
              low24h: data.low_24h || prev.low24h,
              change24h: changePercent
            }));
          }
          return newPrice;
        });

      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 2000);

    return () => clearInterval(interval);
  }, [selectedSymbol, symbolType]);

  // Get AI signal
  const getAISignal = async () => {
    setLoading(true);
    try {
      let authToken = token || localStorage.getItem('token');

      if (!authToken) {
        authToken = await loginDemo();
      }

      if (!authToken) {
        alert('Authentication required. Please log in.');
        navigate('/login');
        return;
      }

      console.log('Sending AI signal request with token:', authToken.substring(0, 20) + '...');
      console.log('Symbol:', selectedSymbol, 'Current Price:', currentPrice);

      const response = await axios.post(
        '/api/ai/signal',
        {
          symbol: selectedSymbol,
          current_price: currentPrice,
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('AI signal response:', response.data);
      setAiSignal(response.data);
    } catch (error) {
      console.error('Error getting AI signal:', error);
      console.error('Error response:', error.response?.data);

      if (error.response?.status === 401) {
        alert('Session expired. Please log in again.');
        navigate('/login');
      } else {
        alert('Failed to get AI signal: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Login helper for demo
  const loginDemo = async () => {
    try {
      const response = await axios.post('/api/login', {
        username: 'admin',
        password: 'admin123',
      });
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      return token;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  // Execute trade
  const executeTrade = async (type) => {
    console.log('executeTrade called with type:', type);
    console.log('currentPrice:', currentPrice, 'activeTrade:', activeTrade);

    if (!currentPrice || activeTrade) {
      console.log('Trade blocked - currentPrice:', currentPrice, 'activeTrade:', activeTrade);
      return;
    }

    const trade = {
      id: Date.now(),
      type,
      symbol: selectedSymbol,
      entryPrice: currentPrice,
      quantity: 0.1,
      timestamp: new Date().toISOString(),
    };

    console.log('Setting active trade:', trade);
    setActiveTrade(trade);
  };

  // End active trade and calculate P&L
  const endTrade = async () => {
    if (!activeTrade || !currentPrice) return;

    const entryPrice = activeTrade.entryPrice;
    const exitPrice = currentPrice;
    const quantity = activeTrade.quantity;

    let pnl;
    if (activeTrade.type === 'BUY') {
      pnl = (exitPrice - entryPrice) * quantity;
    } else {
      pnl = (entryPrice - exitPrice) * quantity;
    }

    const completedTrade = {
      ...activeTrade,
      exitPrice,
      pnl,
      closedAt: new Date().toISOString(),
    };

    setTrades(prev => [completedTrade, ...prev].slice(0, 10));
    setActiveTrade(null);

    try {
      const authToken = token || localStorage.getItem('token');

      if (!authToken) {
        console.warn('No auth token, trade only recorded locally');
        return;
      }

      if (!challengeId) {
        console.error('No active challenge - cannot save trade to backend');
        console.log('💡 Trade will only be recorded locally. Start a challenge to persist trades.');
        return;
      }

      console.log('Recording trade to backend:', {
        challenge_id: challengeId,
        symbol: activeTrade.symbol,
        side: activeTrade.type,
        entry_price: entryPrice,
        exit_price: exitPrice,
        quantity: quantity
      });

      const tradeData = {
        challenge_id: challengeId,
        symbol: activeTrade.symbol,
        side: activeTrade.type,
        entry_price: entryPrice,
        exit_price: exitPrice,
        quantity: quantity
      };

      const response = await axios.post(
        '/api/trades',
        tradeData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Trade recorded successfully:', response.data);

      if (response.data.challenge?.current_balance !== undefined) {
        setBalance(response.data.challenge.current_balance);
        console.log('Balance updated from server:', response.data.challenge.current_balance);
      }

      if (response.data.challenge) {
        setActiveChallenge(response.data.challenge);
      }

      if (challengeId) {
        const historyResponse = await axios.get('/api/trades', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (historyResponse.data.trades) {
          const formattedTrades = historyResponse.data.trades.map(t => ({
            id: t.id,
            type: t.type.toUpperCase(),
            symbol: t.symbol,
            entryPrice: t.entry_price || t.price,
            exitPrice: t.exit_price || t.price,
            quantity: t.quantity,
            pnl: t.pnl,
            closedAt: t.closed_at,
            timestamp: t.opened_at
          }));
          setTrades(formattedTrades.slice(0, 10));
        }
      }

      if (response.data.challenge?.status === 'failed') {
        alert('⚠️ Challenge FAILED! ' + (response.data.message || 'Rules violated.'));
      } else if (response.data.challenge?.status === 'passed') {
        alert('🎉 Challenge PASSED! Congratulations!');
      }
    } catch (error) {
      console.error('Error recording trade to backend:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  // Nuke function
  const executeNuke = async () => {
    try {
      const token = localStorage.getItem('token') || await loginDemo();

      await axios.post(
        '/api/demo/nuke',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setBalance(prev => prev * 0.94);
      alert('NUKE activated! Challenge failed...');
    } catch (error) {
      console.error('Nuke error:', error);
    }
  };

  // Calculate win rate
  const calculateWinRate = () => {
    if (trades.length === 0) return 0;
    const winningTrades = trades.filter(trade => trade.pnl > 0).length;
    return ((winningTrades / trades.length) * 100).toFixed(1);
  };

  // Calculate total P&L
  const calculateTotalPnL = () => {
    return trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Top Navigation Bar */}
      <div className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  PropSense Pro
                </h1>
                <p className="text-xs text-gray-400">Professional Trading Platform</p>
              </div>
            </div>

            <div className="flex space-x-1 bg-gray-900/60 rounded-xl p-1 border border-gray-700/50">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedTab === 'trading' ? 'bg-gray-700 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                onClick={() => setSelectedTab('trading')}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Trading</span>
                </div>
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedTab === 'challenges' ? 'bg-gray-700 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                onClick={() => navigate('/challenges')}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Challenges</span>
                </div>
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedTab === 'history' ? 'bg-gray-700 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                onClick={() => setShowTradeHistory(true)}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>History</span>
                </div>
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedTab === 'leaderboard' ? 'bg-gray-700 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                onClick={() => navigate('/leaderboard')}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Leaderboard</span>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Profile */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-sm font-semibold">{username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">{username}</div>
                <div className="text-xs text-gray-400 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setChatOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat</span>
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                >
                  Admin
                </button>
              )}

              {user?.role === 'superadmin' && (
                <button
                  onClick={() => navigate('/superadmin')}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                >
                  SuperAdmin
                </button>
              )}

              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all duration-300 border border-gray-600 hover:border-gray-500"
              >
                Logout
              </button>
            </div>

            {/* Balance Display */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl px-5 py-3 shadow-lg">
              <div className="text-xs text-gray-400 mb-1">Account Balance</div>
              <div className="text-xl font-bold text-green-400">
                {formatCurrency(balance)} DH
              </div>
              {activeChallenge && (
                <div className="text-xs text-cyan-400 mt-1">
                  {activeChallenge.type} Challenge
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Symbols & Quick Stats */}
          <div className="col-span-2 space-y-6">
            {/* Symbol Selection */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">MARKETS</h3>
                <div className="text-xs text-gray-500">{AVAILABLE_SYMBOLS.length} symbols</div>
              </div>
              <div className="space-y-2">
                {AVAILABLE_SYMBOLS.map((sym) => (
                  <button
                    key={sym.value}
                    onClick={() => handleSymbolChange(sym.value)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-[1.02] group ${selectedSymbol === sym.value
                      ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                      : 'hover:bg-gray-700/50 border border-transparent hover:border-gray-600/50'
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${sym.type === 'crypto' ? 'bg-purple-500' : 'bg-blue-500'
                          }`}></div>
                        <div>
                          <div className="font-medium text-sm">{sym.value}</div>
                          <div className="text-xs text-gray-400">{sym.label.split('(')[0]}</div>
                        </div>
                      </div>
                      {selectedSymbol === sym.value && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 group-hover:text-gray-400">
                      {sym.type === 'crypto' ? 'Cryptocurrency' : 'Moroccan Stock'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">PERFORMANCE</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                    <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                    <div className="text-xl font-bold text-green-400">{calculateWinRate()}%</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                    <div className="text-xs text-gray-400 mb-1">Total Trades</div>
                    <div className="text-xl font-bold text-white">{trades.length}</div>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Total P&L</span>
                    <span className={`font-medium ${calculateTotalPnL() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {calculateTotalPnL() >= 0 ? '+' : ''}{formatCurrency(calculateTotalPnL())} DH
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${calculateTotalPnL() >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                      }`} style={{ width: `${Math.min(100, Math.abs(calculateTotalPnL()) / 1000 * 100)}%` }}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-2">Risk Level</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-yellow-400">Medium</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Challenge */}
            {activeChallenge && (
              <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl border border-cyan-500/20 p-5 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-cyan-300">ACTIVE CHALLENGE</h3>
                  <div className="text-xs text-cyan-400">● Live</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {activeChallenge.type}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">{activeChallenge.description || 'Trading Challenge'}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Target</div>
                      <div className="text-sm font-bold text-green-400">+{activeChallenge.target_profit || 10}%</div>
                    </div>
                    <div className="bg-gray-900/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Max Loss</div>
                      <div className="text-sm font-bold text-red-400">-{activeChallenge.max_daily_loss || 5}%</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-cyan-400 font-medium">
                        {((balance - activeChallenge.initial_balance) / activeChallenge.initial_balance * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((balance - activeChallenge.initial_balance) / activeChallenge.initial_balance * 100) + 50)}%` }}></div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/challenges')}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Chart Area */}
          <div className="col-span-7 space-y-6">
            {/* Chart Header with Market Data */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${symbolType === 'crypto' ? 'bg-purple-900/30' : 'bg-blue-900/30'}`}>
                      {symbolType === 'crypto' ? (
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{selectedSymbol}/USD</div>
                      <div className="text-sm text-gray-400">
                        {AVAILABLE_SYMBOLS.find(s => s.value === selectedSymbol)?.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${isLive ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-gray-700 text-gray-400'
                      }`}>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                        <span>{isLive ? 'LIVE' : 'IDLE'}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">•</div>
                    <div className="text-sm text-gray-400">24h Volume: {formatCurrency(marketStats.volume24h)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Current Price</div>
                    <div className="text-3xl font-bold tracking-tight">
                      {currentPrice ? `${formatCurrency(currentPrice)} DH` : 'Loading...'}
                    </div>
                  </div>
                  <div className={`text-lg font-bold px-4 py-2 rounded-lg ${priceChange.value >= 0
                    ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                    : 'bg-red-900/30 text-red-400 border border-red-500/30'
                    }`}>
                    {priceChange.value >= 0 ? '↗' : '↘'} {priceChange.value >= 0 ? '+' : ''}{priceChange.value.toFixed(2)}
                    <span className="text-sm ml-1">({priceChange.percent.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>

              {/* Market Stats Bar */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-700/50">
                <div className="text-center">
                  <div className="text-xs text-gray-400">24h High</div>
                  <div className="text-sm font-semibold text-green-400">{formatCurrency(marketStats.high24h)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">24h Low</div>
                  <div className="text-sm font-semibold text-red-400">{formatCurrency(marketStats.low24h)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">24h Change</div>
                  <div className={`text-sm font-semibold ${marketStats.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {marketStats.change24h >= 0 ? '+' : ''}{marketStats.change24h.toFixed(2)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">Market</div>
                  <div className="text-sm font-semibold text-blue-400">
                    {symbolType === 'crypto' ? 'Crypto' : 'BVC Casablanca'}
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Container */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl" style={{ height: '550px' }}>
              <div id="tradingview_widget" ref={chartContainerRef} style={{ height: '100%', width: '100%' }} />
            </div>

            {/* Trade Controls */}
            <div className="grid grid-cols-2 gap-4">
              {!activeTrade ? (
                <>
                  {/* BUY Button - Enhanced Premium Design */}
                  <button
                    onClick={() => executeTrade('BUY')}
                    className="group relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-400 hover:via-green-400 hover:to-teal-500 p-5 rounded-2xl font-bold text-white transition-all duration-500 shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] transform overflow-hidden border border-emerald-400/20 hover:border-emerald-300/40"
                  >
                    {/* Animated Background Shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>

                    {/* Pulse Effect on Hover */}
                    <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/10 group-hover:animate-pulse rounded-3xl"></div>

                    <div className="relative text-center z-10">
                      {/* Icon */}
                      <div className="flex justify-center mb-2">
                        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>

                      {/* Text */}
                      <div className="text-xl mb-1 font-bold tracking-tight">BUY / LONG</div>
                      <div className="text-sm opacity-90 font-medium">Enter Bullish Position</div>
                      <div className="text-xs opacity-75 mt-2">Profit when price rises ↗
                      </div>
                    </div>
                  </button>

                  {/* SELL Button - Enhanced Premium Design */}
                  <button
                    onClick={() => executeTrade('SELL')}
                    className="group relative bg-gradient-to-br from-rose-500 via-red-500 to-pink-600 hover:from-rose-400 hover:via-red-400 hover:to-pink-500 p-5 rounded-2xl font-bold text-white transition-all duration-500 shadow-xl hover:shadow-rose-500/30 hover:scale-[1.02] transform overflow-hidden border border-rose-400/20 hover:border-rose-300/40"
                  >
                    {/* Animated Background Shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>



                    <div className="relative text-center z-10">
                      {/* Icon */}
                      <div className="flex justify-center mb-2">
                        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                          </svg>
                        </div>
                      </div>

                      {/* Text */}
                      <div className="text-xl mb-1 font-bold tracking-tight">SELL / SHORT</div>
                      <div className="text-sm opacity-90 font-medium">Enter Bearish Position</div>
                      <div className="text-xs opacity-75 mt-2">Profit when price falls ↘
                      </div>
                    </div>
                  </button>
                </>
              ) : (
                <div className="col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Active Position</div>
                      <div className="flex items-center space-x-4">
                        <div className={`px-6 py-3 rounded-xl font-bold text-lg ${activeTrade.type === 'BUY'
                          ? 'bg-gradient-to-r from-emerald-900/40 to-green-900/40 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gradient-to-r from-rose-900/40 to-red-900/40 text-rose-400 border border-rose-500/30'
                          }`}>
                          {activeTrade.type}
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{activeTrade.symbol}</div>
                          <div className="text-sm text-gray-400">Quantity: {activeTrade.quantity}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-2">Unrealized P&L</div>
                      <div className={`text-3xl font-bold ${activeTrade.type === 'BUY'
                        ? (currentPrice > activeTrade.entryPrice ? 'text-emerald-400' : 'text-rose-400')
                        : (currentPrice < activeTrade.entryPrice ? 'text-emerald-400' : 'text-rose-400')
                        }`}>
                        {activeTrade.type === 'BUY'
                          ? ((currentPrice - activeTrade.entryPrice) * activeTrade.quantity).toFixed(2)
                          : ((activeTrade.entryPrice - currentPrice) * activeTrade.quantity).toFixed(2)
                        } DH
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                      <div className="text-sm text-gray-400 mb-1">Entry Price</div>
                      <div className="text-lg font-bold">{formatCurrency(activeTrade.entryPrice)} DH</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                      <div className="text-sm text-gray-400 mb-1">Current Price</div>
                      <div className="text-lg font-bold">{formatCurrency(currentPrice)} DH</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                      <div className="text-sm text-gray-400 mb-1">Price Change</div>
                      <div className={`text-lg font-bold ${currentPrice > activeTrade.entryPrice ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {((currentPrice - activeTrade.entryPrice) / activeTrade.entryPrice * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                      <div className="text-sm text-gray-400 mb-1">Time Open</div>
                      <div className="text-lg font-bold">
                        {Math.floor((Date.now() - new Date(activeTrade.timestamp).getTime()) / 60000)} min
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTrade(null)}
                      className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-xl py-4 font-bold text-white transition-all duration-300 border border-gray-600 hover:border-gray-500"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={endTrade}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl py-4 font-bold text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                    >
                      CLOSE TRADE
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Trades */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Recent Trades</h3>
                  <p className="text-sm text-gray-400 mt-1">Your latest trading activity</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowTradeHistory(true)}
                    className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg text-sm font-medium transition-all duration-300 border border-gray-600 hover:border-gray-500"
                  >
                    View All History
                  </button>
                  <button
                    onClick={() => navigate('/trade-history')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                  >
                    Detailed Analytics
                  </button>
                </div>
              </div>

              {trades.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 text-gray-600">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">No trades yet</p>
                  <p className="text-gray-500 text-sm mt-2">Start trading to see your history here</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-700/50">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-900/50">
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Type</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Symbol</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Entry</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Exit</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Quantity</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">P&L</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {trades.slice(0, 5).map((trade, index) => (
                          <tr key={trade.id || index} className="hover:bg-gray-800/30 transition-colors duration-200">
                            <td className="py-4 px-6">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${trade.type === 'BUY'
                                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-900/30 text-rose-400 border border-rose-500/30'
                                }`}>
                                {trade.type}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-medium">{trade.symbol}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-mono">{formatCurrency(trade.entryPrice)} DH</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-mono">{formatCurrency(trade.exitPrice)} DH</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-mono">{trade.quantity.toFixed(4)}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className={`font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)} DH
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm text-gray-400">
                                {new Date(trade.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - AI Signal & Tools */}
          <div className="col-span-3 space-y-6">
            {/* AI Signal Card */}
            <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">TradeSense AI</h2>
                    <p className="text-sm text-gray-400">Advanced Market Analysis</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${aiSignal ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              </div>

              <button
                onClick={getAISignal}
                disabled={loading || !currentPrice}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 py-4 rounded-xl font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-6 shadow-lg hover:shadow-purple-500/20 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Analyzing Market Data...
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Get AI Signal</span>
                  </div>
                )}
              </button>

              {aiSignal ? (
                <div className="space-y-6">
                  {/* Signal Display */}
                  <div className={`p-6 rounded-xl border-2 ${aiSignal.signal === 'BUY' ? 'border-emerald-500 bg-gradient-to-r from-emerald-900/20 to-green-900/20' :
                    aiSignal.signal === 'SELL' ? 'border-rose-500 bg-gradient-to-r from-rose-900/20 to-red-900/20' :
                      'border-yellow-500 bg-gradient-to-r from-yellow-900/20 to-amber-900/20'
                    }`}>
                    <div className="text-center mb-4">
                      <div className={`text-4xl font-bold mb-2 ${aiSignal.signal === 'BUY' ? 'text-emerald-400' :
                        aiSignal.signal === 'SELL' ? 'text-rose-400' :
                          'text-yellow-400'
                        }`}>
                        {aiSignal.signal}
                      </div>
                      <div className="text-sm text-gray-300">AI Trading Recommendation</div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Confidence Level</span>
                        <span className="font-semibold">{aiSignal.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${aiSignal.signal === 'BUY' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                            aiSignal.signal === 'SELL' ? 'bg-gradient-to-r from-rose-500 to-red-500' :
                              'bg-gradient-to-r from-yellow-500 to-amber-500'
                            }`}
                          style={{ width: `${aiSignal.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-sm leading-relaxed text-gray-300">
                        {aiSignal.reasoning}
                      </p>
                    </div>
                  </div>

                  {/* Market Stats */}
                  <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/30">
                    <h4 className="text-sm font-semibold text-gray-300 mb-4">MARKET ANALYSIS</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400">Symbol</div>
                        <div className="font-medium">{aiSignal.symbol}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400">Current Price</div>
                        <div className="font-medium">{formatCurrency(aiSignal.current_price)} DH</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400">24h Change</div>
                        <div className={`font-medium ${aiSignal.price_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {aiSignal.price_change >= 0 ? '+' : ''}{aiSignal.price_change.toFixed(2)}%
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400">Volatility</div>
                        <div className="font-medium text-yellow-400">Medium</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 opacity-20">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-2">No AI signal generated yet</p>
                  <p className="text-gray-600 text-xs">Click the button above to get AI-powered trading signals</p>
                </div>
              )}
            </div>

            {/* Market Status */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-xl">
              <h3 className="font-bold mb-6 flex items-center">
                <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Market Status
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
                  <span className="text-sm text-gray-400">Connection Status</span>
                  <span className="flex items-center text-emerald-400">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                    Connected
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
                  <span className="text-sm text-gray-400">Data Feed</span>
                  <span className={`flex items-center ${isLive ? 'text-emerald-400' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'} rounded-full mr-2`}></div>
                    {isLive ? 'Live Streaming' : 'Idle'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
                  <span className="text-sm text-gray-400">Server Latency</span>
                  <span className="text-sm font-medium text-blue-400">12ms</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-400">Order Execution</span>
                  <span className="text-sm font-medium text-emerald-400">Instant</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700/50">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">SYSTEM HEALTH</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">CPU Usage</span>
                      <span className="text-emerald-400">24%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Memory</span>
                      <span className="text-blue-400">68%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tools */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-xl">
              <h3 className="font-bold mb-6">Quick Tools</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/challenge-selection')}
                  className="w-full bg-gradient-to-r from-blue-900/30 to-cyan-900/30 hover:from-blue-900/40 hover:to-cyan-900/40 rounded-xl p-4 text-sm font-medium transition-all duration-300 text-left flex items-center justify-between border border-blue-500/20 hover:border-blue-500/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">New Challenge</div>
                      <div className="text-xs text-gray-400">Start trading challenge</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => navigate('/leaderboard')}
                  className="w-full bg-gradient-to-r from-purple-900/30 to-pink-900/30 hover:from-purple-900/40 hover:to-pink-900/40 rounded-xl p-4 text-sm font-medium transition-all duration-300 text-left flex items-center justify-between border border-purple-500/20 hover:border-purple-500/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Leaderboard</div>
                      <div className="text-xs text-gray-400">View rankings</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Hidden Nuke Feature */}
                <div className="pt-4 border-t border-gray-700/50">
                  <button
                    onClick={() => setShowNuke(!showNuke)}
                    onDoubleClick={showNuke ? executeNuke : undefined}
                    className={`w-full ${showNuke ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 hover:from-orange-900/40 hover:to-red-900/40 border border-orange-500/30' : 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50'} rounded-xl p-4 text-sm font-medium transition-all duration-300 text-left flex items-center justify-between`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${showNuke ? 'bg-orange-500/20' : 'bg-gray-700'} rounded-lg flex items-center justify-center`}>
                        {showNuke ? (
                          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{showNuke ? '⚠️ NUKE ACTIVE' : 'Advanced Settings'}</div>
                        <div className="text-xs text-gray-400">
                          {showNuke ? 'Double-click to activate' : 'System configuration'}
                        </div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Component */}
      <Chat isOpen={chatOpen} onClose={() => setChatOpen(false)} username={username} />

      {/* Trade History Modal */}
      {showTradeHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center p-8 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-900/80">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Trade History
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  Total Trades: {trades.length} | Win Rate: {calculateWinRate()}% | Total P&L:
                  <span className={`ml-1 ${calculateTotalPnL() >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {calculateTotalPnL() >= 0 ? '+' : ''}{formatCurrency(calculateTotalPnL())} DH
                  </span>
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {/* Export functionality */ }}
                  className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg text-sm font-medium transition-all duration-300 border border-gray-600 hover:border-gray-500"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => setShowTradeHistory(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-300 p-2 hover:bg-gray-700/50 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-8">
              {trades.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 text-gray-600">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg mb-2">No trading history yet</p>
                  <p className="text-gray-500 text-sm">Start trading to build your portfolio history</p>
                  <button
                    onClick={() => setShowTradeHistory(false)}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                  >
                    Start Trading
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-700/50">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-800 to-gray-900">
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Trade ID</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Type</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Symbol</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Entry Price</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Exit Price</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Quantity</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">P&L</th>
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {trades.map((trade, index) => (
                          <tr key={trade.id || index} className="hover:bg-gray-800/30 transition-colors duration-200">
                            <td className="py-4 px-6">
                              <div className="text-sm text-gray-400 font-mono">#{trade.id.toString().slice(-6)}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${trade.type === 'BUY'
                                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-900/30 text-rose-400 border border-rose-500/30'
                                }`}>
                                {trade.type}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-medium">{trade.symbol}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-mono">{formatCurrency(trade.entryPrice)} DH</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-mono">{formatCurrency(trade.exitPrice)} DH</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-mono">{trade.quantity.toFixed(4)}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className={`font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)} DH
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm">
                                <div>{new Date(trade.closedAt).toLocaleDateString()}</div>
                                <div className="text-gray-400">{new Date(trade.closedAt).toLocaleTimeString()}</div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-900/80">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Showing {trades.length} trade{trades.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {/* Previous page */ }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50"
                    disabled={true}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-300">Page 1 of 1</span>
                  <button
                    onClick={() => {/* Next page */ }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50"
                    disabled={true}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setShowTradeHistory(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Styles for Button Animations */}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
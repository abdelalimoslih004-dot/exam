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

  // Fetch user's active challenge on mount
  useEffect(() => {
    const fetchActiveChallenge = async () => {
      try {
        const authToken = token || localStorage.getItem('token');
        if (!authToken) return;

        const response = await axios.get('/api/challenges', {
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
          // Don't block UI with alert - just log to console
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

        const response = await axios.get('/api/trades', {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        const tradesData = response.data.trades || [];
        
        // Transform backend trade format to frontend format
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

    // Clear previous widget
    chartContainerRef.current.innerHTML = '';

    // Load TradingView script if not already loaded
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
        toolbar_bg: '#1e222d',
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
          'mainSeriesProperties.candleStyle.upColor': '#26a69a',
          'mainSeriesProperties.candleStyle.downColor': '#ef5350',
          'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
          'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
        }
      });
    }
  }, [symbol]);

  // Fetch real-time price data from our backend
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const apiSymbol = symbol === 'BTCUSD' ? 'BTC' : symbol === 'ETHUSD' ? 'ETH' : symbol;
        const response = await axios.get(`/api/crypto/${apiSymbol}`);
        const data = response.data;
        const newPrice = data.price;
        
        // Trigger live indicator animation
        if (currentPrice !== null && newPrice !== currentPrice) {
          setIsLive(true);
          setTimeout(() => setIsLive(false), 1500);
        }
        
        // Calculate price change
        if (currentPrice !== null) {
          const changeValue = newPrice - currentPrice;
          const changePercent = ((changeValue / currentPrice) * 100);
          setPriceChange({ value: changeValue, percent: changePercent });
        }
        
        setCurrentPrice(newPrice);

      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 2000);

    return () => clearInterval(interval);
  }, [symbol, currentPrice]);

  // Get AI signal
  const getAISignal = async () => {
    setLoading(true);
    try {
      // Use token from AuthContext or get from localStorage
      let authToken = token || localStorage.getItem('token');
      
      // If no token, try to login
      if (!authToken) {
        authToken = await loginDemo();
      }
      
      if (!authToken) {
        alert('Authentication required. Please log in.');
        navigate('/login');
        return;
      }
      
      // Convert symbol to backend format (BTCUSD -> BTC, ETHUSD -> ETH)
      const apiSymbol = symbol === 'BTCUSD' ? 'BTC' : symbol === 'ETHUSD' ? 'ETH' : symbol;
      
      console.log('Sending AI signal request with token:', authToken.substring(0, 20) + '...');
      console.log('Symbol:', apiSymbol, 'Current Price:', currentPrice);
      
      const response = await axios.post(
        '/api/ai/signal',
        {
          symbol: apiSymbol,
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
      symbol,
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

    // Calculate P&L based on trade type (for local display only)
    let pnl;
    if (activeTrade.type === 'BUY') {
      // For BUY/LONG: profit when price goes up
      pnl = (exitPrice - entryPrice) * quantity;
    } else {
      // For SELL/SHORT: profit when price goes down
      pnl = (entryPrice - exitPrice) * quantity;
    }

    // Add to trade history locally (temporary - will be replaced by backend data)
    const completedTrade = {
      ...activeTrade,
      exitPrice,
      pnl,
      closedAt: new Date().toISOString(),
    };

    setTrades(prev => [completedTrade, ...prev].slice(0, 10));
    setActiveTrade(null);

    // Send trade to backend to record and apply killer rules
    try {
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        console.warn('No auth token, trade only recorded locally');
        return;
      }

      if (!challengeId) {
        console.error('No active challenge - cannot save trade to backend');
        console.log('💡 Trade will only be recorded locally. Start a challenge to persist trades.');
        // Don't block trading with alert - allow local-only trading
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
      
      // Update balance from server response (source of truth)
      if (response.data.challenge?.current_balance !== undefined) {
        setBalance(response.data.challenge.current_balance);
        console.log('Balance updated from server:', response.data.challenge.current_balance);
      }

      // Update active challenge data
      if (response.data.challenge) {
        setActiveChallenge(response.data.challenge);
      }

      // Reload trade history to get the recorded trade
      if (challengeId) {
        const historyResponse = await axios.get('/api/trades', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (historyResponse.data.trades) {
          // Transform backend trade format to frontend format
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

      // Check if challenge status changed
      if (response.data.challenge?.status === 'failed') {
        alert('⚠️ Challenge FAILED! ' + (response.data.message || 'Rules violated.'));
      } else if (response.data.challenge?.status === 'passed') {
        alert('🎉 Challenge PASSED! Congratulations!');
      }
    } catch (error) {
      console.error('Error recording trade to backend:', error);
      console.error('Error details:', error.response?.data);
      // Balance will remain unchanged if backend call fails
    }
  };

  // Nuke function (hidden demo feature)
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

      setBalance(prev => prev * 0.94); // -6% loss
      alert('NUKE activated! Challenge failed...');
    } catch (error) {
      console.error('Nuke error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#131722] text-white p-4">
      {/* TradingView-style Header */}
      <div className="flex justify-between items-center mb-4 bg-[#1e222d] px-4 py-3 rounded-lg">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">PropSense</h1>
          <span className="text-gray-500">|</span>
          <div className="text-sm text-gray-400">Professional Trading Platform</div>
        </div>

        {/* Navigation & Balance */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {username}
          </div>

          <button
            onClick={() => navigate('/leaderboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200"
          >
            Leaderboard
          </button>

          <button
            onClick={() => navigate('/challenges')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200"
          >
            Challenges
          </button>

          <button
            onClick={() => navigate('/trade-history')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all duration-200"
          >
            Trade History
          </button>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200"
            >
              Admin Panel
            </button>
          )}

          {user?.role === 'superadmin' && (
            <button
              onClick={() => navigate('/superadmin')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200 shadow-lg"
            >
              SuperAdmin
            </button>
          )}

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200"
          >
            Community Chat
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all duration-200"
          >
            Logout
          </button>

          <div className="bg-[#2a2e39] px-4 py-2 rounded border border-[#434651]">
            {activeChallenge ? (
              <>
                <div className="text-xs text-gray-400">{activeChallenge.type} Challenge</div>
                <div className={`text-lg font-bold ${balance >= activeChallenge.initial_balance ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                  {balance.toFixed(2)} DH
                </div>
                <div className={`text-xs ${(balance - activeChallenge.initial_balance) >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                  {(balance - activeChallenge.initial_balance) >= 0 ? '+' : ''}
                  {(balance - activeChallenge.initial_balance).toFixed(2)} DH
                  ({((balance - activeChallenge.initial_balance) / activeChallenge.initial_balance * 100).toFixed(2)}%)
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/challenge-selection')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200 text-sm"
                >
                  Select Challenge
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Chart Container - TradingView Widget */}
          <div className="bg-[#1e222d] rounded-lg overflow-hidden border border-[#2b2b43]" style={{ height: '600px' }}>
            <div id="tradingview_widget" ref={chartContainerRef} style={{ height: '100%', width: '100%' }} />
          </div>

          {/* Trade Controls - TradingView Style */}
          {!activeTrade ? (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => executeTrade('BUY')}
                className="bg-[#26a69a] hover:bg-[#2bb3a5] py-3 rounded font-bold text-white transition-all duration-200 shadow-lg"
              >
                BUY / LONG
              </button>
              
              <button
                onClick={() => executeTrade('SELL')}
                className="bg-[#ef5350] hover:bg-[#f45d5a] py-3 rounded font-bold text-white transition-all duration-200 shadow-lg"
              >
                SELL / SHORT
              </button>

              {/* Hidden Nuke Button */}
              <button
                onClick={() => setShowNuke(!showNuke)}
                onDoubleClick={showNuke ? executeNuke : undefined}
                className={`${showNuke ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#2a2e39] hover:bg-[#363a45]'} py-3 rounded font-bold text-white transition-all duration-200`}
              >
                {showNuke ? 'NUKE' : 'Settings'}
              </button>
            </div>
          ) : (
            <div className="bg-[#2a2e39] rounded-lg p-4 border border-[#434651]">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-sm text-gray-400">Active Position</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${activeTrade.type === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                      {activeTrade.type}
                    </span>
                    <span className="text-white font-semibold">{activeTrade.symbol}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Entry Price</div>
                  <div className="text-white font-mono">${activeTrade.entryPrice.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-3 pt-3 border-t border-[#434651]">
                <div>
                  <div className="text-sm text-gray-400">Current Price</div>
                  <div className="text-white font-mono">${currentPrice?.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Unrealized P&L</div>
                  <div className={`text-lg font-bold ${
                    activeTrade.type === 'BUY' 
                      ? (currentPrice > activeTrade.entryPrice ? 'text-[#26a69a]' : 'text-[#ef5350]')
                      : (currentPrice < activeTrade.entryPrice ? 'text-[#26a69a]' : 'text-[#ef5350]')
                  }`}>
                    {activeTrade.type === 'BUY'
                      ? ((currentPrice - activeTrade.entryPrice) * activeTrade.quantity).toFixed(2)
                      : ((activeTrade.entryPrice - currentPrice) * activeTrade.quantity).toFixed(2)
                    } DH
                  </div>
                </div>
              </div>
              
              <button
                onClick={endTrade}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold text-white transition-all duration-200 shadow-lg"
              >
                END TRADE
              </button>
            </div>
          )}

          {/* Recent Trades Panel */}
          <div className="bg-[#1e222d] rounded-lg border border-[#2b2b43] p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-white">Recent Trades</h3>
              {trades.length > 0 && (
                <button
                  onClick={() => navigate('/trade-history')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  View All →
                </button>
              )}
            </div>
            <div className="space-y-2">
              {trades.length === 0 && (
                <p className="text-gray-500 text-center py-6">No trades yet</p>
              )}
              {trades.slice(0, 5).map(trade => (
                <div key={trade.id} className="bg-[#2a2e39] p-3 rounded space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${trade.type === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                      {trade.type}
                    </span>
                    <span className="text-gray-300">{trade.symbol}</span>
                    <span className={`font-bold ${trade.pnl >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} DH
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Entry: ${trade.entryPrice.toLocaleString()}</span>
                    <span>Exit: ${trade.exitPrice.toLocaleString()}</span>
                    <span>{new Date(trade.closedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#1e222d] border border-[#2b2b43] p-5 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">TradeSense AI</h2>
                <p className="text-xs text-gray-500">Smart Signals</p>
              </div>
            </div>

            <button
              onClick={getAISignal}
              disabled={loading || !currentPrice}
              className="w-full bg-[#2962FF] hover:bg-[#1e53e5] py-2.5 rounded font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? 'Analyzing...' : 'Get Signal'}
            </button>

            {aiSignal && (
              <div className="space-y-3">
                {/* Signal Display */}
                <div className={`p-4 rounded border-2 ${
                  aiSignal.signal === 'BUY' ? 'bg-[#26a69a]/10 border-[#26a69a]' :
                  aiSignal.signal === 'SELL' ? 'bg-[#ef5350]/10 border-[#ef5350]' :
                  'bg-yellow-500/10 border-yellow-500'
                }`}>
                  <div className="text-center mb-2">
                    <div className="text-2xl font-bold">{aiSignal.signal}</div>
                    <div className="text-xs text-gray-400">
                      Confidence: {aiSignal.confidence}%
                    </div>
                  </div>
                  
                  <div className="w-full bg-[#2a2e39] rounded-full h-1.5 mb-3">
                    <div
                      className={`h-1.5 rounded-full ${
                        aiSignal.signal === 'BUY' ? 'bg-[#26a69a]' :
                        aiSignal.signal === 'SELL' ? 'bg-[#ef5350]' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${aiSignal.confidence}%` }}
                    ></div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {aiSignal.reasoning}
                  </p>
                </div>

                {/* Market Stats */}
                <div className="bg-[#2a2e39] p-3 rounded space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Symbol</span>
                    <span className="font-semibold text-white">{aiSignal.symbol}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold text-white">${aiSignal.current_price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Change</span>
                    <span className={aiSignal.price_change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
                      {aiSignal.price_change >= 0 ? '+' : ''}{aiSignal.price_change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!aiSignal && !loading && (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-xs">Click to get AI market analysis</p>
              </div>
            )}
          </div>

          {/* Quick Stats - TradingView Style */}
          <div className="bg-[#1e222d] border border-[#2b2b43] p-5 rounded-lg">
            <h3 className="text-sm font-bold mb-4 text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statistics
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Trades Today</span>
                <span className="font-semibold text-white">{trades.length}</span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Win Rate</span>
                <span className="font-semibold text-[#26a69a]">
                  {trades.length > 0 ? '65%' : '--'}
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">P&L Today</span>
                <span className={`font-semibold ${balance >= 5000 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                  {balance >= 5000 ? '+' : ''}{(balance - 5000).toFixed(2)} DH
                </span>
              </div>
              
              <div className="flex justify-between text-xs pt-2 border-t border-[#2b2b43]">
                <span className="text-gray-500">Risk Level</span>
                <span className="font-semibold text-yellow-500">Medium</span>
              </div>
            </div>
          </div>

          {/* Market Status */}
          <div className="bg-[#1e222d] border border-[#2b2b43] p-5 rounded-lg">
            <h3 className="text-sm font-bold mb-3 text-white">Market Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Server</span>
                <span className="flex items-center gap-1 text-[#26a69a]">
                  <div className="w-2 h-2 bg-[#26a69a] rounded-full"></div>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Data Feed</span>
                <span className={`flex items-center gap-1 ${isLive ? 'text-[#26a69a]' : 'text-gray-500'}`}>
                  <div className={`w-2 h-2 ${isLive ? 'bg-[#26a69a]' : 'bg-gray-600'} rounded-full`}></div>
                  {isLive ? 'Live' : 'Idle'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Latency</span>
                <span className="text-white">~12ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Component */}
      <Chat isOpen={chatOpen} onClose={() => setChatOpen(false)} username={username} />

      {/* Trade History Modal */}
      {showTradeHistory && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e222d] rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden border border-[#2b2b43]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#2b2b43]">
              <div>
                <h2 className="text-2xl font-bold text-white">Trade History</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Total Trades: {trades.length} | Win Rate: {trades.length > 0 ? '65%' : '--'}
                </p>
              </div>
              <button
                onClick={() => setShowTradeHistory(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              {trades.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400 text-lg">No trades yet</p>
                  <p className="text-gray-500 text-sm mt-2">Start trading to see your history here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trades.map((trade, index) => (
                    <div key={trade.id || index} className="bg-[#2a2e39] rounded-lg p-4 border border-[#434651] hover:border-[#4a4e59] transition-colors">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {/* Trade Type & Symbol */}
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded text-sm font-bold ${
                            trade.type === 'BUY' ? 'bg-[#26a69a]/20 text-[#26a69a]' : 'bg-[#ef5350]/20 text-[#ef5350]'
                          }`}>
                            {trade.type}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{trade.symbol}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(trade.closedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Entry Price */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Entry</div>
                          <div className="text-white font-semibold">
                            ${trade.entryPrice?.toLocaleString() || 'N/A'}
                          </div>
                        </div>

                        {/* Exit Price */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Exit</div>
                          <div className="text-white font-semibold">
                            ${trade.exitPrice?.toLocaleString() || 'N/A'}
                          </div>
                        </div>

                        {/* Quantity */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Quantity</div>
                          <div className="text-white font-semibold">
                            {trade.quantity?.toFixed(4) || 'N/A'}
                          </div>
                        </div>

                        {/* P&L */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">P&L</div>
                          <div className={`font-bold text-lg ${
                            trade.pnl >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'
                          }`}>
                            {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2) || '0.00'} DH
                          </div>
                        </div>

                        {/* Time */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Time</div>
                          <div className="text-white font-semibold">
                            {new Date(trade.closedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#2b2b43] bg-[#131722]">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Showing all {trades.length} trade{trades.length !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={() => setShowTradeHistory(false)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

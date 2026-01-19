import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TradeHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    symbol: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, trades]);

  const fetchTrades = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        navigate('/login');
        return;
      }

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
        status: t.status || 'closed',
        closedAt: t.closed_at,
        timestamp: t.opened_at
      }));

      setTrades(formattedTrades);
      setFilteredTrades(formattedTrades);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trades];

    // Filter by symbol
    if (filters.symbol) {
      filtered = filtered.filter(t => t.symbol === filters.symbol);
    }

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.timestamp) <= new Date(filters.dateTo));
    }

    setFilteredTrades(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const resetFilters = () => {
    setFilters({
      symbol: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Calculate statistics
  const stats = {
    totalTrades: filteredTrades.length,
    winningTrades: filteredTrades.filter(t => t.pnl > 0).length,
    losingTrades: filteredTrades.filter(t => t.pnl < 0).length,
    totalPnL: filteredTrades.reduce((sum, t) => sum + t.pnl, 0),
    bestTrade: filteredTrades.length > 0 ? Math.max(...filteredTrades.map(t => t.pnl)) : 0,
    worstTrade: filteredTrades.length > 0 ? Math.min(...filteredTrades.map(t => t.pnl)) : 0,
    winRate: filteredTrades.length > 0 
      ? (filteredTrades.filter(t => t.pnl > 0).length / filteredTrades.length * 100).toFixed(1)
      : 0
  };

  // Get unique symbols for filter
  const uniqueSymbols = [...new Set(trades.map(t => t.symbol))];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatPrice = (price) => {
    return price ? price.toFixed(2) : 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading trade history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Trade History</h1>
            <p className="text-gray-400">Complete record of your trading activity</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Trades</p>
            <p className="text-white text-2xl font-bold">{stats.totalTrades}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Win Rate</p>
            <p className="text-green-400 text-2xl font-bold">{stats.winRate}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(2)} DH
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Winning Trades</p>
            <p className="text-green-400 text-2xl font-bold">{stats.winningTrades}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Best Trade</p>
            <p className="text-green-400 text-2xl font-bold">+{stats.bestTrade.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Worst Trade</p>
            <p className="text-red-400 text-2xl font-bold">{stats.worstTrade.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Symbol</label>
              <select
                name="symbol"
                value={filters.symbol}
                onChange={handleFilterChange}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Symbols</option>
                {uniqueSymbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Date From</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Date To</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Entry Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Exit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">P&L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTrades.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-400">
                      No trades found
                    </td>
                  </tr>
                ) : (
                  filteredTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">#{trade.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(trade.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{trade.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          trade.type === 'BUY' 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-red-900 text-red-200'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatPrice(trade.entryPrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatPrice(trade.exitPrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trade.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} DH
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                          {trade.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;

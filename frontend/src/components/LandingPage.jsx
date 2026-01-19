import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LandingPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const isDark = savedMode === null ? true : savedMode === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  const navigateToPlan = (plan) => {
    navigate('/checkout', {
      state: {
        plan
      }
    });
  };

  const startFreeTrial = async () => {
    try {
      const res = await axios.post('/api/demo/free-trial');
      const { access_token, user, challenge } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('challengeId', challenge.id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      navigate('/dashboard');
    } catch (err) {
      console.error('Free trial error:', err);
      alert('Free trial unavailable pour le moment.');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full border-b z-50 backdrop-blur-sm bg-opacity-95 transition-colors ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xl">PS</span>
              </div>
              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>PropSense</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`font-medium transition-colors ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-900'}`}>Features</a>
              <a href="#security" className={`font-medium transition-colors ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-900'}`}>Security</a>
              <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                {darkMode ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                )}
              </button>
              <div className={`flex items-center space-x-2 border-l pl-6 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                <button onClick={() => changeLanguage('fr')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${i18n.language === 'fr' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>FR</button>
                <button onClick={() => changeLanguage('en')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${i18n.language === 'en' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>EN</button>
                <button onClick={() => changeLanguage('ar')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${i18n.language === 'ar' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>AR</button>
              </div>
              <button onClick={() => navigate('/login')} className={`px-6 py-2 font-semibold rounded transition-colors ${darkMode ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-900 hover:bg-gray-50'}`}>Sign In</button>
              <button onClick={() => navigate('/register')} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors shadow-lg">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-900'}`}>Institutional-Grade Prop Firm</div>
              <h1 className={`text-5xl md:text-6xl font-bold mb-6 leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Trade. Prove. Get Funded.<br /><span className={darkMode ? 'text-blue-400' : 'text-blue-900'}>Without the noise.</span></h1>
              <p className={`text-xl mb-8 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Clear rules, bank-level infrastructure, and fast funding decisions. Focus on execution while we handle risk, compliance, and payouts.</p>
              <div className="flex gap-4 mb-12">
                <button onClick={() => navigate('/register')} className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl">Start Trading</button>
                <button onClick={() => navigate('/login')} className={`px-8 py-4 font-semibold rounded-lg border-2 transition-colors ${darkMode ? 'bg-gray-800 text-blue-400 border-blue-500 hover:bg-gray-700' : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'}`}>Client Portal</button>
              </div>
              <div className={`grid grid-cols-3 gap-6 pt-8 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div><div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>1000+</div><div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Traders</div></div>
                <div><div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>$2M+</div><div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Profits Distributed</div></div>
                <div><div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>24/7</div><div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Support</div></div>
              </div>
            </div>
            <div className={`rounded-2xl p-8 shadow-2xl border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'}`}>
              <div className={`rounded-lg p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-6">
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ACCOUNT OVERVIEW</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Balance</div>
                    <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>$125,847.32</div>
                    <div className="text-sm text-green-500 font-semibold mt-1">+12.5% This Month</div>
                  </div>
                  <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div><div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Win Rate</div><div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>68.4%</div></div>
                    <div><div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Profit Factor</div><div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>2.45</div></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className={`rounded p-3 shadow ${darkMode ? 'bg-gray-700' : 'bg-white'}`}><div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>BTC/USD</div><div className="text-sm font-bold text-green-500">+2.3%</div></div>
                <div className={`rounded p-3 shadow ${darkMode ? 'bg-gray-700' : 'bg-white'}`}><div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>EUR/USD</div><div className="text-sm font-bold text-red-500">-0.8%</div></div>
                <div className={`rounded p-3 shadow ${darkMode ? 'bg-gray-700' : 'bg-white'}`}><div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>S&P 500</div><div className="text-sm font-bold text-green-500">+1.2%</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Challenges */}
      <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className={`uppercase tracking-[0.2em] text-xs font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
              Funding Programs
            </p>
            <h2 className={`text-4xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Clear rules. Straightforward funding.
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Three challenges. Same governance: Max daily loss 5%, Max total loss 10%, Profit target 10%.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '200',
                currency: 'DH',
                gradient: 'from-blue-600 to-blue-400',
                features: {
                  capital: '10 000 DH virtual',
                  profit: '80% profit split',
                  dailyLoss: '-5% max daily',
                  target: '+10% profit target'
                }
              },
              {
                name: 'Pro',
                price: '500',
                currency: 'DH',
                gradient: 'from-indigo-600 to-blue-500',
                features: {
                  capital: '25 000 DH virtual',
                  profit: '85% profit split',
                  dailyLoss: '-5% max daily',
                  target: '+10% profit target'
                }
              },
              {
                name: 'Elite',
                price: '1000',
                currency: 'DH',
                gradient: 'from-slate-800 to-blue-700',
                features: {
                  capital: '50 000 DH virtual',
                  profit: '90% profit split',
                  dailyLoss: '-5% max daily',
                  target: '+10% profit target'
                }
              }
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl border shadow-xl p-8 flex flex-col justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-4 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                    {plan.name}
                  </div>
                  <div className={`text-4xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price} {plan.currency}
                  </div>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>One-time evaluation fee</p>
                  <div className="mt-6 space-y-3">
                    <div className={`p-3 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{plan.features.capital}</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{plan.features.profit}</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{plan.features.dailyLoss}</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{plan.features.target}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => navigateToPlan(plan)}
                    className="w-full py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Payer avec CMI (mock)
                  </button>
                  <button
                    onClick={() => navigateToPlan(plan)}
                    className={`w-full py-3 rounded-lg font-semibold border transition-colors ${darkMode ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-100'}`}
                  >
                    Payer avec Crypto (mock)
                  </button>
                  <button
                    onClick={() => navigateToPlan(plan)}
                    className={`w-full py-3 rounded-lg font-semibold border transition-colors ${darkMode ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-100'}`}
                  >
                    Payer avec PayPal (superadmin configuré)
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-10 p-6 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Règles de l'évaluation</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Perte max journalière : -5% | Perte max totale : -10% | Objectif de profit : +10%. Le Killer vérifie après chaque trade et change le statut du challenge (active, failed, passed).
            </p>
          </div>

          <div className={`mt-6 flex flex-col sm:flex-row gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <button
              onClick={startFreeTrial}
              className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow"
            >
              Lancer une Free Trial (démo)
            </button>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm sm:self-center`}>
              Crée un compte démo, challenge actif 5 000 DH, règles appliquées automatiquement.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`py-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Enterprise-Grade Trading Infrastructure</h2>
            <p className={`text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Built with institutional technology to deliver professional-grade performance and reliability</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Real-Time Market Data', desc: 'Access live cryptocurrency and stock market data with sub-millisecond latency from global exchanges.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { title: 'Advanced Analytics', desc: 'Professional-grade charting tools powered by TradingView with custom indicators and backtesting capabilities.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { title: 'Risk Management', desc: 'Automated risk controls and compliance monitoring to protect your capital with customizable parameters.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
              { title: 'Profit Sharing', desc: 'Competitive profit split structure with transparent payout terms and fast withdrawal processing.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { title: 'Community Platform', desc: 'Connect with professional traders, share strategies, and access exclusive market insights and analysis.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { title: '24/7 Support', desc: 'Dedicated support team available around the clock to assist with technical and trading-related inquiries.', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' }
            ].map((feature, i) => (
              <div key={i} className={`rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} /></svg>
                </div>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-4xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bank-Level Security</h2>
              <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your capital and data are protected with enterprise-grade security infrastructure and compliance with international financial regulations.</p>
              <div className="space-y-4">
                {[
                  { title: '256-bit Encryption', desc: 'Military-grade encryption for all data transmission and storage' },
                  { title: 'Regulatory Compliance', desc: 'Full compliance with financial industry standards and regulations' },
                  { title: 'Segregated Accounts', desc: 'Client funds held in segregated accounts with tier-1 banks' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1 mr-4 flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-12 text-white">
              <div className="text-center">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">Trusted by Professionals</h3>
                <p className="text-blue-100 mb-8">Join thousands of traders who trust our platform with their capital</p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white bg-opacity-10 rounded-lg p-4"><div className="text-3xl font-bold">99.9%</div><div className="text-sm text-blue-100">Uptime</div></div>
                  <div className="bg-white bg-opacity-10 rounded-lg p-4"><div className="text-3xl font-bold">&lt; 50ms</div><div className="text-sm text-blue-100">Latency</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white`}>
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Trading?</h2>
          <p className="text-xl text-gray-300 mb-8">Join our platform today and access institutional-grade trading infrastructure</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/register')} className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors">Create Account</button>
            <button onClick={() => navigate('/login')} className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-gray-900 transition-colors">Sign In</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded flex items-center justify-center"><span className="text-white font-bold">PS</span></div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>PropSense</span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Professional proprietary trading platform for modern traders.</p>
            </div>
            <div><h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Platform</h4><ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}><li><a href="#" className={darkMode ? 'hover:text-blue-400' : 'hover:text-blue-900'}>Features</a></li><li><a href="#" className={darkMode ? 'hover:text-blue-400' : 'hover:text-blue-900'}>Pricing</a></li><li><a href="#" className={darkMode ? 'hover:text-blue-400' : 'hover:text-blue-900'}>API</a></li></ul></div>
            <div><h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Company</h4><ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}><li><a href="#" className={darkMode ? 'hover:text-blue-400' : 'hover:text-blue-900'}>About</a></li><li><a href="#" className={darkMode ? 'hover:text-blue-400' : 'hover:text-blue-900'}>Careers</a></li><li><a href="#" className={darkMode ? 'hover:text-blue-400' : 'hover:text-blue-900'}>Contact</a></li></ul></div>
            <div><h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Legal</h4><ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}><li><a href="#" className={darkMode ? 'hover:text-blue-400' : 'hover:text-blue-900'}>Privacy</a></li><li><a href="#" className={darkMode ? 'hover:text-blue-400' : 'hover:text-blue-900'}>Terms</a></li><li><a href="#" className={darkMode ? 'hover:text-blue-400' : 'hover:text-blue-900'}>Compliance</a></li></ul></div>
          </div>
          <div className={`border-t pt-8 text-center text-sm ${darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
            <p>&copy; 2026 PropSense. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

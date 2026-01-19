import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get plan from navigation state
    const plan = location.state?.plan;
    if (!plan) {
      navigate('/');
      return;
    }
    setSelectedPlan(plan);

    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=sb&currency=USD';
    script.async = true;
    script.onload = () => {
      if (window.paypal) {
        renderPayPalButton();
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [location, navigate]);

  const renderPayPalButton = () => {
    const paypalContainer = document.getElementById('paypal-button-container');
    if (!paypalContainer || !window.paypal) return;

    paypalContainer.innerHTML = '';

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal'
      },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: (parseFloat(selectedPlan.price.replace(',', '')) / 10).toFixed(2) // Convert DH to USD mock
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        return actions.order.capture().then(async (details) => {
          await handlePaymentSuccess('PayPal', details.id);
        });
      },
      onError: (err) => {
        setError('PayPal payment failed. Please try again.');
        console.error('PayPal Error:', err);
      }
    }).render('#paypal-button-container');
  };

  const handleCMIPayment = async () => {
    setIsProcessing(true);
    setError('');

    // Simulate CMI payment processing with 3-second delay
    setTimeout(async () => {
      const mockTransactionId = `CMI-${Date.now()}`;
      await handlePaymentSuccess('CMI', mockTransactionId);
    }, 3000);
  };

  const handleCryptoPayment = async () => {
    setIsProcessing(true);
    setError('');

    // Simulate Crypto payment processing with 3-second delay
    setTimeout(async () => {
      const mockTransactionId = `CRYPTO-${Date.now()}`;
      await handlePaymentSuccess('Crypto', mockTransactionId);
    }, 3000);
  };

  const handlePaymentSuccess = async (method, transactionId) => {
    try {
      // Login as admin to get token
      const loginResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
        username: 'admin',
        password: 'admin123'
      });

      const token = loginResponse.data.access_token;

      // Create challenge via quick-buy
      const buyResponse = await axios.post(
        '/api/demo/quick-buy',
        {
          initial_balance: parseFloat(selectedPlan.price.replace(',', ''))
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Store token and navigate to dashboard
      localStorage.setItem('token', token);
      localStorage.setItem('challengeId', buyResponse.data.challenge.id);
      localStorage.setItem('paymentMethod', method);
      localStorage.setItem('transactionId', transactionId);

      // Show success message and redirect
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            newChallenge: buyResponse.data.challenge,
            paymentMethod: method,
            transactionId: transactionId
          }
        });
      }, 1000);

    } catch (err) {
      setError('Failed to create challenge. Please try again.');
      console.error('Payment processing error:', err);
      setIsProcessing(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Plans
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-gray-400 mt-2">Complete your purchase to start trading</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 h-fit">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            
            <div className={`bg-gradient-to-r ${selectedPlan.gradient} p-6 rounded-xl mb-6`}>
              <h3 className="text-2xl font-bold mb-2">{selectedPlan.name}</h3>
              <div className="text-4xl font-bold mb-4">{selectedPlan.price} {selectedPlan.currency}</div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Initial Capital</span>
                <span className="font-semibold">{selectedPlan.features.capital}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Profit Share</span>
                <span className="font-semibold text-green-400">{selectedPlan.features.profit}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Max Daily Loss</span>
                <span className="font-semibold text-red-400">{selectedPlan.features.dailyLoss}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Profit Target</span>
                <span className="font-semibold text-blue-400">{selectedPlan.features.target}</span>
              </div>
            </div>

            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                💡 <strong>Demo Mode:</strong> All payments are simulated for demonstration purposes.
              </p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                  <p className="text-red-200">{error}</p>
                </div>
              )}

              {isProcessing && (
                <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-8 mb-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-blue-200 text-lg font-semibold">Processing Payment...</p>
                  <p className="text-gray-400 text-sm mt-2">Please wait while we confirm your transaction</p>
                </div>
              )}

              {!isProcessing && (
                <>
                  {/* Payment Method Selector */}
                  <div className="space-y-4 mb-6">
                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'paypal'
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900/60 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 11h18M7 15h2m2 0h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-bold">PayPal</div>
                          <div className="text-sm text-gray-400">Pay with PayPal (Sandbox)</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('cmi')}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'cmi'
                          ? 'border-green-500 bg-green-900/30'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900/60 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-7 9 7v8a2 2 0 01-2 2h-3a2 2 0 01-2-2V12H8v6a2 2 0 01-2 2H3a2 2 0 01-2-2v-8z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-bold">CMI Payment</div>
                          <div className="text-sm text-gray-400">Moroccan bank card (Mock)</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('crypto')}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'crypto'
                          ? 'border-purple-500 bg-purple-900/30'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900/60 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6a3 3 0 110 6H9m6-6a3 3 0 010 6m-2 6V4m-2 16V4" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-bold">Cryptocurrency</div>
                          <div className="text-sm text-gray-400">Pay with BTC/ETH (Mock)</div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Payment Form */}
                  <div className="bg-gray-900/50 rounded-xl p-6">
                    {paymentMethod === 'paypal' && (
                      <div>
                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-400 mb-4">
                            Click the PayPal button below to complete your purchase in sandbox mode
                          </p>
                        </div>
                        <div id="paypal-button-container"></div>
                      </div>
                    )}

                    {paymentMethod === 'cmi' && (
                      <div>
                        <div className="text-center mb-6">
                          <p className="text-sm text-gray-400 mb-4">
                            This is a simulated CMI payment gateway
                          </p>
                        </div>
                        <button
                          onClick={handleCMIPayment}
                          className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:shadow-xl hover:shadow-green-500/50 py-4 rounded-xl font-bold text-lg transition-all duration-300"
                        >
                          Pay {selectedPlan.price} DH with CMI
                        </button>
                      </div>
                    )}

                    {paymentMethod === 'crypto' && (
                      <div>
                        <div className="text-center mb-6">
                          <p className="text-sm text-gray-400 mb-4">
                            This is a simulated cryptocurrency payment
                          </p>
                        </div>
                        <button
                          onClick={handleCryptoPayment}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:shadow-xl hover:shadow-purple-500/50 py-4 rounded-xl font-bold text-lg transition-all duration-300"
                        >
                          Pay with Crypto (Mock)
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-900/60 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Secure Payment</h3>
                  <p className="text-sm text-gray-400">
                    All payments are encrypted and secure. For this demo, all transactions are simulated
                    and no real money will be charged.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

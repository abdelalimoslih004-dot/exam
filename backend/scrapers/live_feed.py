"""
Live Feed Manager - Real-time Crypto Price Updates
Uses yfinance to fetch live Bitcoin prices
"""
import yfinance as yf
from datetime import datetime
import time
from threading import Thread


class LiveFeedManager:
    """Manager for live cryptocurrency price feeds"""
    
    def __init__(self):
        self.btc_ticker = yf.Ticker("BTC-USD")
        self.eth_ticker = yf.Ticker("ETH-USD")
        self.is_running = False
        self.latest_data = {
            'BTC': None,
            'ETH': None,
            'timestamp': None
        }
    
    def get_btc_price(self):
        """Get current Bitcoin price"""
        try:
            # Get real-time data from yfinance
            data = self.btc_ticker.history(period='1d', interval='1m')
            
            if not data.empty:
                latest = data.iloc[-1]
                open_price = float(latest['Open'])
                close_price = float(latest['Close'])
                change_percent = ((close_price - open_price) / open_price * 100) if open_price > 0 else 0
                
                return {
                    'symbol': 'BTC-USD',
                    'price': round(close_price, 2),
                    'open': round(open_price, 2),
                    'high': round(float(latest['High']), 2),
                    'low': round(float(latest['Low']), 2),
                    'volume': int(latest['Volume']),
                    'change_percent': round(change_percent, 2),
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            return None
            
        except Exception as e:
            print(f"Error fetching BTC price: {str(e)}")
            return None
    
    def get_eth_price(self):
        """Get current Ethereum price"""
        try:
            data = self.eth_ticker.history(period='1d', interval='1m')
            
            if not data.empty:
                latest = data.iloc[-1]
                open_price = float(latest['Open'])
                close_price = float(latest['Close'])
                change_percent = ((close_price - open_price) / open_price * 100) if open_price > 0 else 0
                
                return {
                    'symbol': 'ETH-USD',
                    'price': round(close_price, 2),
                    'open': round(open_price, 2),
                    'high': round(float(latest['High']), 2),
                    'low': round(float(latest['Low']), 2),
                    'volume': int(latest['Volume']),
                    'change_percent': round(change_percent, 2),
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            return None
            
        except Exception as e:
            print(f"Error fetching ETH price: {str(e)}")
            return None
    
    def get_crypto_info(self, symbol='BTC'):
        """Get detailed information about a cryptocurrency"""
        try:
            ticker = yf.Ticker(f"{symbol}-USD")
            info = ticker.info
            
            return {
                'symbol': symbol,
                'name': info.get('name', symbol),
                'market_cap': info.get('marketCap'),
                'volume_24h': info.get('volume24Hr'),
                'circulating_supply': info.get('circulatingSupply'),
                'price_change_24h': info.get('regularMarketChangePercent'),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error fetching {symbol} info: {str(e)}")
            return None
    
    def get_all_crypto_prices(self):
        """Get prices for all tracked cryptocurrencies"""
        btc_data = self.get_btc_price()
        eth_data = self.get_eth_price()
        
        return {
            'BTC': btc_data,
            'ETH': eth_data,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def update_latest_data(self):
        """Update latest price data (background task)"""
        while self.is_running:
            try:
                self.latest_data = self.get_all_crypto_prices()
                time.sleep(60)  # Update every minute
            except Exception as e:
                print(f"Error in update loop: {str(e)}")
                time.sleep(60)
    
    def start_monitoring(self):
        """Start background monitoring thread"""
        if not self.is_running:
            self.is_running = True
            thread = Thread(target=self.update_latest_data, daemon=True)
            thread.start()
            print("✅ Live feed monitoring started")
    
    def stop_monitoring(self):
        """Stop background monitoring"""
        self.is_running = False
        print("⏹️ Live feed monitoring stopped")
    
    def get_latest_data(self):
        """Get the latest cached data"""
        if not self.latest_data['timestamp']:
            # If no cached data, fetch now
            return self.get_all_crypto_prices()
        return self.latest_data
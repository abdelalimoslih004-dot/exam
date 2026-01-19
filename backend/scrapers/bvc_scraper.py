"""
BVC.ma Web Scraper - Bourse des Valeurs de Casablanca
Scrapes stock data from the Moroccan Stock Exchange

IMPORTANT: Les sélecteurs utilisés ont été identifiés via l'analyse IA de la structure HTML 
du site casablanca-bourse.com. Ces sélecteurs peuvent changer si le site est mis à jour.
"""
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time
import urllib3
import threading

# Désactiver les warnings SSL pour les tests (à retirer en production)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class BVCScraper:
    """Scraper for Bourse des Valeurs de Casablanca (BVC)"""
    
    def __init__(self):
        self.base_url = "https://www.casablanca-bourse.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
        })
        
        # Stock symbols supported
        self.stocks = {
            'IAM': {'isin': 'MA0000011488', 'name': 'Itissalat Al-Maghrib'},
            'ATW': {'isin': 'MA0000011835', 'name': 'Attijariwafa Bank'},
            'LHM': {'isin': 'MA0000011884', 'name': 'LafargeHolcim Maroc'},
            'SMI': {'isin': 'MA0000011900', 'name': 'SMI'}
        }
        
        # Cache pour stocker les données
        self.cache = {}
        self.monitoring_thread = None
        self.monitoring_active = False
    
    def scrape_stock(self, symbol):
        """
        Scrape stock data from Casablanca Bourse for any supported symbol
        
        Args:
            symbol: Stock symbol (IAM, ATW, LHM, SMI)
        
        Note: Les sélecteurs ont été identifiés via analyse IA.
        Structure: tables HTML avec <tr><td>Label</td><td>Value</td></tr>
        """
        try:
            # Vérifier si le symbole est supporté
            if symbol not in self.stocks:
                print(f"❌ Symbole {symbol} non supporté")
                return self._get_simulated_data(symbol)
            
            stock_info = self.stocks[symbol]
            url = f"{self.base_url}/fr/live-market/instruments/{symbol}"
            
            print(f"🔍 Scraping {symbol} data from: {url}")
            
            # Note: verify=False pour tests locaux uniquement
            response = self.session.get(url, timeout=15, verify=False)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Structure identifiée par IA: tables HTML
            # Format: <tr><td>Label</td><td>Valeur</td></tr>
            data = {}
            
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= 2:
                        label = cells[0].get_text(strip=True)
                        value = cells[1].get_text(strip=True)
                        
                        # Mapper les labels aux clés
                        if 'Cours' in label and 'MAD' in label:
                            data['price'] = value
                        elif label == 'Variation':
                            data['variation'] = value
                        elif 'Volume' in label or 'Quantité' in label:
                            data['volume'] = value
            
            # Si on a trouvé les données de prix
            if 'price' in data:
                # Parser le prix (format: "111,05" ou "111.05")
                price = float(data['price'].replace(',', '.').replace(' ', ''))
                
                # Parser la variation (format: "-1,02%" ou "+2.5%")
                variation = 0.0
                if 'variation' in data:
                    var_text = data['variation'].replace('%', '').replace(',', '.').replace(' ', '')
                    variation = float(var_text) if var_text else 0.0
                
                # Parser le volume
                volume = 0
                if 'volume' in data:
                    vol_text = data['volume'].replace(',', '').replace(' ', '')
                    try:
                        volume = int(vol_text)
                    except:
                        volume = 0
                
                print(f"✅ Données réelles: {symbol} Prix={price} MAD, Var={variation}%")
                
                return {
                    'symbol': symbol,
                    'name': stock_info['name'],
                    'isin': stock_info['isin'],
                    'price': price,
                    'variation': variation,
                    'volume': volume,
                    'market': 'Casablanca Bourse',
                    'currency': 'MAD',
                    'timestamp': datetime.utcnow().isoformat(),
                    'source': 'Casablanca Bourse (Real Data)',
                    'url': url
                }
            else:
                print("⚠️ Données réelles non trouvées, utilisation de données simulées")
                return self._get_simulated_data(symbol)
            
        except requests.RequestException as e:
            print(f"❌ Erreur réseau lors du scraping {symbol}: {str(e)}")
            return self._get_simulated_data(symbol)
        
        except Exception as e:
            print(f"❌ Erreur lors du scraping {symbol}: {str(e)}")
            return self._get_simulated_data(symbol)
    
    def scrape_iam_stock(self):
        """Scrape IAM stock (backward compatibility)"""
        return self.scrape_stock('IAM')
    
    def scrape_atw_stock(self):
        """Scrape ATW (Attijariwafa Bank) stock"""
        return self.scrape_stock('ATW')
    
    def scrape_lhm_stock(self):
        """Scrape LHM (LafargeHolcim) stock"""
        return self.scrape_stock('LHM')
    
    def scrape_smi_stock(self):
        """Scrape SMI stock"""
        return self.scrape_stock('SMI')
    
    def scrape_all_stocks(self):
        """Scrape all supported stocks"""
        results = {}
        for symbol in self.stocks.keys():
            results[symbol] = self.scrape_stock(symbol)
            time.sleep(0.5)  # Petite pause entre chaque requête
        return results
    
    def get_cached_stock(self, symbol):
        """Récupère les données depuis le cache (mise à jour toutes les 2 minutes)"""
        if symbol in self.cache:
            return self.cache[symbol]
        else:
            # Si pas en cache, scraper directement
            return self.scrape_stock(symbol)
    
    def get_all_cached_stocks(self):
        """Récupère toutes les données depuis le cache"""
        if not self.cache:
            # Si cache vide, scraper maintenant
            return self.scrape_all_stocks()
        return self.cache.copy()
    
    def _update_cache(self):
        """Met à jour le cache avec les données fraîches (usage interne)"""
        print("\n🔄 Mise à jour du cache BVC...")
        for symbol in self.stocks.keys():
            try:
                data = self.scrape_stock(symbol)
                self.cache[symbol] = data
                time.sleep(0.5)  # Pause entre requêtes
            except Exception as e:
                print(f"❌ Erreur mise à jour {symbol}: {e}")
        print(f"✅ Cache BVC mis à jour à {datetime.now().strftime('%H:%M:%S')}")
    
    def _monitoring_loop(self, interval=120):
        """Boucle de monitoring en background (toutes les 2 minutes par défaut)"""
        while self.monitoring_active:
            try:
                self._update_cache()
                time.sleep(interval)
            except Exception as e:
                print(f"❌ Erreur dans monitoring BVC: {e}")
                time.sleep(interval)
    
    def start_monitoring(self, interval=120):
        """Démarre le monitoring automatique (mise à jour toutes les 2 minutes)"""
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            print("⚠️ Monitoring BVC déjà actif")
            return
        
        print(f"🚀 Démarrage monitoring BVC (mise à jour toutes les {interval} secondes)...")
        
        # Première mise à jour immédiate
        self._update_cache()
        
        # Démarrer le thread de monitoring
        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(
            target=self._monitoring_loop,
            args=(interval,),
            daemon=True
        )
        self.monitoring_thread.start()
        print("✅ Monitoring BVC démarré")
    
    def stop_monitoring(self):
        """Arrête le monitoring automatique"""
        if self.monitoring_active:
            print("🛑 Arrêt du monitoring BVC...")
            self.monitoring_active = False
            if self.monitoring_thread:
                self.monitoring_thread.join(timeout=5)
            print("✅ Monitoring BVC arrêté")
    
    def _get_simulated_data(self, symbol):
        """
        Retourne des données simulées en cas d'échec du scraping
        Utilisé pour les tests et comme fallback
        """
        import random
        
        # Prix de base pour chaque action
        base_prices = {
            'IAM': 111.00,
            'ATW': 555.00,
            'LHM': 1850.00,
            'SMI': 2100.00
        }
        
        stock_info = self.stocks.get(symbol, {'name': symbol, 'isin': 'UNKNOWN'})
        base_price = base_prices.get(symbol, 100.0)
        variation = random.uniform(-2.0, 2.0)
        
        return {
            'symbol': symbol,
            'name': stock_info['name'],
            'isin': stock_info['isin'],
            'price': round(base_price + random.uniform(-5, 5), 2),
            'variation': round(variation, 2),
            'volume': random.randint(50000, 200000),
            'market': 'Casablanca Bourse',
            'currency': 'MAD',
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'Simulated Data (Fallback)',
            'url': 'simulated'
        }
    
    def _get_simulated_iam_data(self):
        """Backward compatibility wrapper"""
        return self._get_simulated_data('IAM')
    
    def scrape_bvc_indices(self):
        """Scraper les principaux indices BVC (MASI, MADEX)"""
        try:
            url = f"{self.base_url}/cotations/indices"
            response = self.session.get(url, timeout=10, verify=False)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Placeholder - structure à adapter selon le site réel
            return {
                'MASI': {'value': 0, 'variation': 0},
                'MADEX': {'value': 0, 'variation': 0}
            }
        except Exception as e:
            print(f"Erreur scraping indices: {str(e)}")
            return {}


if __name__ == "__main__":
    scraper = BVCScraper()
    print("Test du scraper BVC...")
    iam = scraper.scrape_iam_stock()
    print(f"IAM: {iam['price']} MAD ({iam['variation']}%)")

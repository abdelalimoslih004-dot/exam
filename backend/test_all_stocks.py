"""Test scraping de tous les instruments de la Bourse de Casablanca"""
import sys
sys.path.insert(0, r'C:\Users\abdel\Desktop\propsens\backend')

from scrapers.bvc_scraper import BVCScraper

print("="*70)
print("Test scraping - Tous les instruments de la Bourse de Casablanca")
print("="*70)

scraper = BVCScraper()

# Test des instruments individuels
instruments = ['IAM', 'ATW', 'LHM', 'SMI']

for symbol in instruments:
    print(f"\n{'='*70}")
    print(f"📊 {symbol}")
    print('='*70)
    
    data = scraper.scrape_stock(symbol)
    
    print(f"Nom: {data['name']}")
    print(f"ISIN: {data['isin']}")
    print(f"Prix: {data['price']} {data['currency']}")
    print(f"Variation: {data['variation']}%")
    print(f"Volume: {data['volume']:,}")
    print(f"Source: {data['source']}")
    print(f"URL: {data.get('url', 'N/A')}")

print(f"\n{'='*70}")
print("✅ Test terminé")
print("="*70)

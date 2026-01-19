"""Test rapide du scraping IAM avec vraie URL"""
import sys
sys.path.insert(0, r'C:\Users\abdel\Desktop\propsens\backend')

from scrapers.bvc_scraper import BVCScraper

print("="*60)
print("Test scraping IAM - Casablanca Bourse")
print("="*60)

scraper = BVCScraper()
data = scraper.scrape_iam_stock()

print(f"\nSymbol: {data['symbol']}")
print(f"Prix: {data['price']} {data['currency']}")
print(f"Variation: {data['variation']}%")
print(f"Volume: {data['volume']:,}")
print(f"Source: {data['source']}")
print(f"URL: {data.get('url', 'N/A')}")
print(f"Timestamp: {data['timestamp']}")
print("\n" + "="*60)


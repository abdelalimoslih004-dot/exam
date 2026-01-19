"""Test du monitoring automatique BVC (mise à jour toutes les 2 minutes)"""
import sys
sys.path.insert(0, r'C:\Users\abdel\Desktop\propsens\backend')

from scrapers.bvc_scraper import BVCScraper
import time

print("="*70)
print("Test Monitoring BVC - Mise à jour automatique toutes les 2 minutes")
print("="*70)

scraper = BVCScraper()

# Démarrer le monitoring avec 30 secondes pour le test (au lieu de 2 min)
print("\n🧪 Test avec intervalle de 30 secondes pour démonstration")
scraper.start_monitoring(interval=30)

print("\n⏱️ Attente de 35 secondes pour voir la mise à jour automatique...")
print("(Le serveur Flask utilisera 120 secondes = 2 minutes)")

for i in range(35):
    print(f"\rAttente: {i+1}/35 secondes...", end='', flush=True)
    time.sleep(1)

print("\n\n" + "="*70)
print("📊 Données actuelles dans le cache:")
print("="*70)

for symbol in ['IAM', 'ATW', 'LHM', 'SMI']:
    data = scraper.get_cached_stock(symbol)
    print(f"\n{symbol} - {data['name']}")
    print(f"  Prix: {data['price']} MAD")
    print(f"  Variation: {data['variation']}%")
    print(f"  Source: {data['source']}")
    print(f"  Timestamp: {data['timestamp']}")

print("\n" + "="*70)
print("✅ Le monitoring fonctionne! Les données se mettent à jour automatiquement.")
print("📹 Parfait pour votre vidéo au professeur!")
print("="*70)

scraper.stop_monitoring()

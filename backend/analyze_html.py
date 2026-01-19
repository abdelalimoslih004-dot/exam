"""Analyser la structure HTML du site Casablanca Bourse"""
import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

url = "https://www.casablanca-bourse.com/fr/live-market/instruments/IAM"

print("Récupération de la page...")
session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

response = session.get(url, verify=False, timeout=15)
soup = BeautifulSoup(response.content, 'html.parser')

print(f"\nStatut: {response.status_code}")
print(f"Taille HTML: {len(response.content)} bytes")

# Chercher des éléments contenant "cours", "dernier", "prix"
print("\n=== Recherche 'cours' ===")
for elem in soup.find_all(class_=lambda x: x and 'cours' in x.lower()):
    print(f"Classe: {elem.get('class')} -> Texte: {elem.get_text(strip=True)[:50]}")

print("\n=== Recherche 'dernier' ===")
for elem in soup.find_all(text=lambda x: x and 'dernier' in x.lower()):
    print(f"Tag: {elem.parent.name} -> Texte: {elem.strip()[:50]}")

print("\n=== Recherche 'prix' ou 'price' ===")
for elem in soup.find_all(class_=lambda x: x and ('prix' in str(x).lower() or 'price' in str(x).lower())):
    print(f"Classe: {elem.get('class')} -> Texte: {elem.get_text(strip=True)[:50]}")

# Chercher des tableaux
print("\n=== Tables trouvées ===")
for i, table in enumerate(soup.find_all('table')[:3]):
    print(f"\nTable {i+1}:")
    for row in table.find_all('tr')[:3]:
        cells = [cell.get_text(strip=True) for cell in row.find_all(['td', 'th'])]
        print(f"  {cells}")

# Chercher divs avec données
print("\n=== Divs avec nombres ===")
import re
for div in soup.find_all('div')[:50]:
    text = div.get_text(strip=True)
    if re.search(r'\d{2,3}[.,]\d{2}', text):  # Chercher format prix
        print(f"Classe: {div.get('class')} -> {text[:80]}")

print("\n=== Script tags (pour détecter JS) ===")
scripts = soup.find_all('script')
print(f"Nombre de scripts: {len(scripts)}")
for script in scripts[:3]:
    if script.string and 'IAM' in script.string:
        print(f"Script contient 'IAM': {script.string[:100]}")

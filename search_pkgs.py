import argparse
import httpx
from bs4 import BeautifulSoup

TIMEOUT = 30 # délai d'attente de 30 secondes

W_COL = "\033[0;33m" # Couleur d'avertissement
E_COL = "\033[0;31m" # Couleur d'erreur
I_COL = "\033[0;32m" # Couleur d'info
R_COL = "\033[0m" # Réinitialiser la couleur

FOUND = f"{I_COL}Trouvé{R_COL}"
NOT_FOUND = f"{W_COL}Non trouvé{R_COL}"

def check_linux_mint(package: str):
    """Vérifie si un paquet existe dans les dépôts Linux Mint (basés sur Ubuntu)"""
    try:
        res = httpx.get(f"https://packages.ubuntu.com/noble/{package}", timeout=TIMEOUT)
        
        res.raise_for_status()
        
        if "<p>No such package.</p>" in res.text or "No such package" in res.text:
            return NOT_FOUND
        return FOUND
    
    except httpx.ReadTimeout:
        return f"{E_COL}Délai d'attente dépassé : {TIMEOUT} seconde(s){R_COL}"
    except httpx.HTTPStatusError as err:
        if err.response.status_code == 404:
            return NOT_FOUND
        else:
            return f"{E_COL}Erreur - Code de statut : {err.response.status_code}{R_COL}"
    except Exception as err:
        return f"{E_COL}Erreur : {type(err).__name__}{R_COL}"


argparser = argparse.ArgumentParser(description="Rechercher un paquet pour Linux Mint")
argparser.add_argument("PAQUET", help="Nom du paquet à rechercher")
args = argparser.parse_args()
package: str = args.PAQUET


print(f"Linux Mint (basé sur Ubuntu noble) [{check_linux_mint(package)}]")

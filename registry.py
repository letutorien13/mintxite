import contextlib
import json
import shutil
from pathlib import Path

import tomllib

# Linux Mint (édition Ubuntu) réutilise les paquets Ubuntu.
# Snap est ignoré : Mint ne l'installe pas.
DISTRO_KEYS = {"ubuntu", "debian", "fedora", "arch", "mint"}

icon_names = {
    i[0].strip(): i[1].strip()
    for i in (
        i.split(":", maxsplit=1)
        for i in Path("registry/_icons.yml").read_text().splitlines()
    )
}


def copy_icon_for_pkg(pkg_name: str):
    icon_name = icon_names.get(pkg_name, pkg_name)
    with contextlib.suppress(FileNotFoundError, FileExistsError):
        shutil.copy(
            f"/usr/share/icons/Papirus/24x24/apps/{icon_name}.svg",
            f"public/icons/{pkg_name}.svg",
        )


def unsupported(section: dict) -> bool:
    command = section.get("install_command", "").strip()
    return command == "exit 1"


def mint_section(pkg: dict) -> dict:
    """Choisit la méthode d'installation qui marche sous Linux Mint."""
    if isinstance(pkg.get("mint"), dict):
        return dict(pkg["mint"])

    if not DISTRO_KEYS.intersection(pkg):
        return dict(pkg)

    ubuntu = dict(pkg.get("ubuntu") or {})
    debian = dict(pkg.get("debian") or {})

    # Les fiches Ubuntu passent souvent par Snap. Mint bloque Snap :
    # on prend alors la méthode Debian (apt, Flatpak ou script .deb).
    if ubuntu.get("snap"):
        if debian and not unsupported(debian) and not debian.get("snap"):
            return debian
        ubuntu.pop("snap", None)
        return ubuntu

    # Une fiche Ubuntu « exit 1 » est un réglage propre à une autre
    # distribution (dépôts Debian, RPM Fusion...). On ne la remplace pas.
    if ubuntu:
        return ubuntu
    if debian and not unsupported(debian):
        return debian
    return {
        "install_command": 'echo "Pas de méthode d\'installation pour Linux Mint."\nexit 1'
    }


registry_path = Path("registry")
registry = {}
for pkg_path in registry_path.glob("*.toml"):
    with pkg_path.open("rb") as pkg_file:
        pkg = tomllib.load(pkg_file)
        registry[pkg_path.stem] = {"mint": mint_section(pkg)}
        copy_icon_for_pkg(pkg_path.stem)


hooks = {}
for hooks_path in registry_path.glob("@*.sh"):
    hooks[hooks_path.stem.removeprefix("@")] = hooks_path.read_text()

if "mint" not in hooks:
    raise SystemExit("registry/@mint.sh est absent")

with open("src/hooks.json", "w") as hooks_file:
    json.dump(hooks, hooks_file)

with open("src/registry.json", "w") as registry_file:
    json.dump(registry, registry_file)


for pkg_name, distros in registry.items():
    pkg = distros["mint"]
    for dep_name in pkg.get("dependencies", []):
        if dep_name not in registry:
            print(f"Attention : {pkg_name} dépend du paquet inconnu {dep_name}")
    if "curl" in pkg.get("install_command", ""):
        if "curl" not in pkg.get("dependencies", []):
            print(
                f"Attention : {pkg_name} utilise curl dans install_command mais ne le liste pas comme dépendance"
            )
    if "install_command" in pkg and "install_system" in pkg:
        print(
            f"Attention : {pkg_name} a à la fois install_command et install_system définis"
        )
    if "flatpak" in pkg and "snap" in pkg:
        print(f"Attention : {pkg_name} a à la fois flatpak et snap définis")
    if pkg.get("snap"):
        print(f"Attention : {pkg_name} installe encore via Snap, refusé sous Mint")

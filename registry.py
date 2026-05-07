import contextlib
import json
import shutil
from pathlib import Path

import tomllib

# Adapté pour Linux Mint uniquement
distros = {"mint"}


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


registry_path = Path("registry")
registry = {}
for pkg_path in registry_path.glob("*.toml"):
    with pkg_path.open("rb") as pkg_file:
        pkg = tomllib.load(pkg_file)
        if "mint" not in pkg:
            pkg = {dist_name: pkg for dist_name in distros}
        registry[pkg_path.stem] = pkg
        copy_icon_for_pkg(pkg_path.stem)


hooks = {}
for hooks_path in registry_path.glob("@*.sh"):
    hooks[hooks_path.stem.removeprefix("@")] = hooks_path.read_text()

with open("src/hooks.json", "w") as hooks_file:
    json.dump(hooks, hooks_file)

with open("src/registry.json", "w") as registry_file:
    json.dump(registry, registry_file)


for pkg_name, pkg in registry.items():
    if set(pkg.keys()) != distros:
        print(
            f"Attention : {pkg_name} ne dispose pas d'instructions pour la distribution supportée, manquant : {', '.join(distros - set(pkg.keys()))}"
        )
    for pkg in pkg.values():
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

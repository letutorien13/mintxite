<p align="center">
    <strong><a href="https://letutorien13.github.io/mintxite/">ouvrir l'application</a></strong>
</p>

Mintxite génère un script bash pour installer une sélection de logiciels sous **Linux Mint** (édition basée sur Ubuntu).

Tu coches les applications, tu télécharges `mintxite.sh`, puis tu le lances. Le script passe par `apt` ou Flatpak. Il n'utilise pas Snap : Linux Mint le bloque.

C'est une adaptation de [Nixite](https://github.com/aspizu/nixite) d'[aspizu](https://github.com/aspizu). Les fiches d'installation viennent de ce projet. Quand la fiche Ubuntu passe par Snap, Mintxite installe le paquet `apt` ou le Flatpak.

## Utiliser le site

1. Ouvre [letutorien13.github.io/mintxite](https://letutorien13.github.io/mintxite/).
2. Coche les logiciels. La touche `A` sélectionne les suggestions, `D` télécharge.
3. Sur le Mint cible :

```shell
bash ~/Downloads/mintxite.sh
```

Le mot de passe administrateur peut être demandé. Le script s'arrête si la machine n'est pas un Linux Mint basé sur Ubuntu.

## Générer un script en local

```shell
python3 registry.py
bun nixite-cli.ts firefox,vlc,git
bash mintxite.sh
```

Sans argument, ou avec `--all`, la commande écrit un script pour toute la liste, y compris des paquets internes (dépôts). Pour une installation normale, passe les noms séparés par des virgules, ou utilise le site.

Lancer l'interface en local :

```shell
bun install
bun run dev
```

Le site de développement est servi sous `/mintxite/`.

## Ajouter un logiciel

Crée `registry/nom.toml`. Une section `[mint]` est utilisée telle quelle. Sinon Mintxite reprend `[ubuntu]`, puis `[debian]` si la fiche Ubuntu est absente ou limitée à Snap.

```toml
[mint]
install_system = "nom-du-paquet"
```

```toml
[mint]
install_system = "org.exemple.App"
flatpak = true
```

`install_command` reçoit des commandes bash. Ajoute `skip_if_exists` pour ne pas relancer un installeur déjà en place. Si la commande utilise `curl`, ajoute `curl` dans `dependencies`.

Puis ajoute la ligne dans `src/categories.json` et régénère :

```shell
python3 registry.py
```

`search_pkgs.py nom` vérifie si le paquet existe dans Ubuntu noble, la base de Linux Mint 22.

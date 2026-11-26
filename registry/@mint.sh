export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y ca-certificates curl wget gnupg software-properties-common

# Les PPA Launchpad publient le nom de code Ubuntu (noble, resolute...),
# pas celui de Mint (wilma, zara...). On fait répondre lsb_release -cs
# avec la base Ubuntu pour les commandes qui ne passent pas par sudo.
if [[ -n "${UBUNTU_CODENAME:-}" ]]; then
    install -d /tmp/mintxite-bin
    cat > /tmp/mintxite-bin/lsb_release << EOF
#!/bin/sh
if [ "\$1" = "-cs" ] || [ "\$1" = "-sc" ]; then
    echo "${UBUNTU_CODENAME}"
    exit 0
fi
exec /usr/bin/lsb_release "\$@"
EOF
    chmod +x /tmp/mintxite-bin/lsb_release
    export PATH="/tmp/mintxite-bin:${PATH}"
fi

install_system() {
    sudo apt-get install -y "$@"
}

install_flatpak() {
    if ! command -v flatpak &> /dev/null; then
        install_system flatpak
    fi
    sudo flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
    sudo flatpak install --system -y flathub "$@"
}

install_snap() {
    echo "Linux Mint n'utilise pas Snap. Choisis une autre application." >&2
    exit 1
}

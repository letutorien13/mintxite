import {saveAs} from "file-saver"
import hljs from "highlight.js/lib/core"
import bash from "highlight.js/lib/languages/bash"
import * as nixite from "./nixite"

hljs.registerLanguage("bash", bash)

type PkgData = {id: string; element: HTMLSpanElement; checkbox: HTMLInputElement}

function collectPkgElements(): PkgData[] {
    return Array.from(document.querySelectorAll(".Pkg")).map((element) => ({
        id: (element as HTMLElement).dataset.id!,
        element: element as HTMLSpanElement,
        checkbox: element.querySelector('input[type="checkbox"]') as HTMLInputElement,
    }))
}

function getSelectedIds(): string[] {
    return pkgElements.filter(({checkbox}) => checkbox.checked).map(({id}) => id)
}

function getDefaultPackages(): PkgData[] {
    return pkgElements.filter(({element}) => element.dataset.default === "true")
}

function generateScript(): string {
    const selectedIds = getSelectedIds()
    return nixite.createScript(distroSelect.value, selectedIds)
}

function renderInfoBadges(): void {
    if (distroSelect.value == "arch") {
        badgeParu.style.display = "flex"
    } else {
        badgeParu.style.display = "none"
    }
    if (
        pkgElements.some(
            (pkg) =>
                pkg.checkbox.checked &&
                !!nixite.registry[pkg.id][distroSelect.value].flatpak,
        )
    ) {
        badgeFlatpak.style.display = "flex"
    } else {
        badgeFlatpak.style.display = "none"
    }
    if (
        pkgElements.some(
            (pkg) =>
                pkg.checkbox.checked &&
                !!nixite.registry[pkg.id][distroSelect.value].dependencies?.includes(
                    "rpmfusion",
                ),
        )
    ) {
        badgeRpmfusion.style.display = "flex"
    } else {
        badgeRpmfusion.style.display = "none"
    }
}

function renderPreview(): void {
    const script = generateScript()
    preview.textContent = script
    delete preview.dataset.highlighted
    hljs.highlightElement(preview)
}

function renderBadges(): void {
    pkgElements.forEach(({id, element}) => {
        const pkg = nixite.registry[id][distroSelect.value]
        const tooltipElement = element.parentElement?.querySelector(
            ".tooltip",
        ) as HTMLElement
        const tooltipTextElement = tooltipElement.querySelector(
            ".tooltip-text",
        ) as HTMLElement
        tooltipTextElement.textContent = ""
        const badgePatterns: {
            tooltip: string
            field: keyof nixite.Pkg
            patterns?: RegExp[]
            test?: () => any
        }[] = [
            {
                tooltip: "Not supported",
                field: "install_command",
                patterns: [/\bexit 1\b/],
            },
            {
                tooltip: "3rd-party installer script",
                field: "install_command",
                patterns: [
                    /\b(curl|wget)\b.*\|\s*(bash|sh)\b/,
                    /\b(bash|sh)\s+\<\(curl\b/,
                    /\b(bash|sh)\s+-c\s+\"\$\(curl\b/,
                    /\bbash\s+<\(curl\b/,
                ],
            },
            {
                tooltip: "RPMFusion repository",
                field: "dependencies",
                patterns: [/\brpmfusion\b/],
            },
            {
                tooltip: "3rd-party repository",
                field: "install_command",
                patterns: [
                    /\b\/etc\/apt\/sources\.list\b/,
                    /\b\/etc\/apt\/sources\.list\.d\//,
                    /\bapt-key\b/,
                    /\bgpg.*\/etc\/apt\//,
                    /\btee\s+\/etc\/apt\//,
                    /\b\/etc\/yum\.repos\.d\//,
                    /\brpm.*import.*\.asc/,
                    /\btee\s+\/etc\/yum\.repos\.d\//,
                    /\bcopr\s+enable\b/,
                    /\badd-apt-repository\s+ppa:/i,
                    /\bapt\.fury\.io\b/,
                    /\bdownload\.opensuse\.org\b/,
                ],
            },
            {
                tooltip: "Direct package download",
                field: "install_command",
                patterns: [
                    /\.deb.*\s+&&\s+.*apt/,
                    /\.rpm.*\s+&&\s+.*dnf/,
                    /\.rpm.*\s+&&\s+.*rpm/,
                    /curl.*\.(deb|rpm).*\s+-o\s+/,
                ],
            },
            {
                tooltip: "Flatpak package",
                field: "flatpak",
                test: () => pkg.flatpak === true,
            },
            {
                tooltip: "Snap package",
                field: "snap",
                test: () => pkg.snap === true || pkg.snap === "classic",
            },
            {
                tooltip: "PPA repository",
                field: "install_command",
                patterns: [/\badd-apt-repository\s+ppa:/i],
            },
            {
                tooltip: "GitHub release",
                field: "install_command",
                patterns: [
                    /github\.com.*\/releases\/.*\.(deb|rpm)/,
                    /curl.*github\.com.*\/download\//,
                    /vencord\.dev\/download\//,
                ],
            },
            {
                tooltip: "COPR repository",
                field: "install_command",
                patterns: [/\bcopr\s+enable\b/],
            },
        ]

        for (const pattern of badgePatterns) {
            let matches: any = false

            if (pattern.test) {
                matches = pattern.test()
            } else if (pattern.patterns) {
                const value = pkg[pattern.field]
                if (value) {
                    matches = pattern.patterns.some((regex) =>
                        regex.test(value.toString()),
                    )
                }
            }

            if (matches) {
                tooltipTextElement.textContent = pattern.tooltip
                break
            }
        }

        if (tooltipTextElement.textContent) {
            tooltipElement.style.display = "block"
        } else {
            tooltipElement.style.display = "none"
        }
    })
}
function render(): void {
    renderBadges()
    renderPreview()
    renderInfoBadges()
}

function handleInstall(): void {
    const script = generateScript()
    const blob = new Blob([script], {type: "text/plain;charset=utf-8"})
    saveAs(blob, "nixite.sh")
}

function toggleDefaultPackages(): void {
    const defaultPackages = getDefaultPackages()
    const newSelectionState = !isDefaultSelected

    defaultPackages.forEach(({checkbox}) => {
        checkbox.checked = newSelectionState
    })

    isDefaultSelected = newSelectionState
    renderPreview()
}

function handleKeyPress(event: KeyboardEvent): void {
    // Ignore if user is typing in input fields
    if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
    ) {
        return
    }

    switch (event.key.toLowerCase()) {
        case "a":
            toggleDefaultPackages()
            break
        case "d":
            installBtn.click()
            break
    }
}

const pkgElements = collectPkgElements()
const preview = document.getElementById("preview")!
const distroSelect = document.getElementById("distro") as HTMLSelectElement
const installBtn = document.getElementById("install-btn") as HTMLButtonElement
const badgeParu = document.getElementById("badge-paru") as HTMLElement
const badgeFlatpak = document.getElementById("badge-flatpak") as HTMLElement
const badgeRpmfusion = document.getElementById("badge-rpmfusion") as HTMLElement

let isDefaultSelected = false

distroSelect.addEventListener("input", render)
installBtn.addEventListener("click", handleInstall)
document.addEventListener("keyup", handleKeyPress)

pkgElements.forEach(({checkbox}) => {
    checkbox.addEventListener("input", render)
})

render()

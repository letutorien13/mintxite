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

function renderPreview(): void {
    const script = generateScript()
    preview.textContent = script
    delete preview.dataset.highlighted
    hljs.highlightElement(preview)
}

function renderBadges(): void {
    pkgElements.forEach(({id, element}) => {
        const pkg = nixite.registry[id][distroSelect.value]
        const tooltipTextElement = element.parentElement?.querySelector(
            ".tooltip-text",
        ) as HTMLElement
        if (
            pkg.install_command &&
            (/\b(curl|wget)\b.*\b(bash|sh)\b/.test(pkg.install_command) ||
                /\b(bash|sh)\s+\<\(curl\b/.test(pkg.install_command) ||
                /\b(bash|sh)\s+-c\s+\"\$\(curl\b/.test(pkg.install_command))
        ) {
            tooltipTextElement.textContent = "3rd-party installer script"
        }
        if (pkg.install_command && /\b\/etc\/apt\/sources.list\b/) {
            tooltipTextElement.textContent = "3rd-party repository"
        }
    })
}

function render(): void {
    renderBadges()
    renderPreview()
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

function handleCheckboxInput(): void {
    renderPreview()
}

const pkgElements = collectPkgElements()
const preview = document.getElementById("preview")!
const distroSelect = document.getElementById("distro") as HTMLSelectElement
const installBtn = document.getElementById("install-btn") as HTMLButtonElement

let isDefaultSelected = false

distroSelect.addEventListener("input", render)
installBtn.addEventListener("click", handleInstall)
document.addEventListener("keyup", handleKeyPress)

pkgElements.forEach(({checkbox}) => {
    checkbox.addEventListener("input", handleCheckboxInput)
})

render()

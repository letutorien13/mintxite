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
    pkgElements.forEach(({id}) => {
        const pkg = nixite.registry[id][distroSelect.value]
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
    if (event.key === "a") toggleDefaultPackages()
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

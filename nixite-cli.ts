import {writeFileSync} from "node:fs"
import * as nixite from "./src/scripts/nixite.ts"

const argv: string[] = typeof Bun !== "undefined" ? Bun.argv : process.argv
const arg = argv[2]
let selection = Object.keys(nixite.registry)
if (arg && arg !== "--all") {
    selection = arg
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
}

const unknown = selection.filter((name) => !nixite.registry[name])
if (unknown.length) {
    console.error(`Paquet inconnu : ${unknown.join(", ")}`)
    process.exit(1)
}

const script = nixite.createScript("mint", selection)
writeFileSync("mintxite.sh", script)
console.log(`Script mintxite.sh généré (${selection.length} entrée${selection.length > 1 ? "s" : ""}).`)

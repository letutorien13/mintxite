import * as nixite from "./src/scripts/nixite.ts"
const distro = "mint"
let selection = Object.keys(nixite.registry)
if (Bun.argv[2] != "--all") {
    selection = Bun.argv[2].split(",").map((s) => s.trim())
}
const script = nixite.createScript(distro, selection)
await Bun.file("mintxite.sh").write(script)
console.log("✅ Script mintxite.sh généré avec succès!")

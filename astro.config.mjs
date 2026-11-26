// @ts-check
import tailwindcss from "@tailwindcss/vite"
import {defineConfig} from "astro/config"

// https://astro.build/config
export default defineConfig({
    site: "https://letutorien13.github.io",
    base: "/mintxite",
    vite: {
        plugins: [tailwindcss()],
    },
})

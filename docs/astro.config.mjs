// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  base: "/realtimex-crm/docs/",
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    assets: "assets",
  },
  integrations: [
    starlight({
      title: "RealTimeX CRM",
      favicon: "./public/favicon.svg",
      customCss: ["./src/styles/global.css"],
      logo: {
        dark: "./public/logo_realtimex_dark.svg",
        light: "./public/logo_realtimex_light.svg",
      },
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:title",
            content: "RealTimeX CRM Documentation",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:description",
            content: "A full-featured CRM toolkit for personalized solutions.",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:type",
            content: "website",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:url",
            content: "https://github.com/therealtimex/realtimex-crm",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content:
              "https://github.com/therealtimex/realtimex-crm/raw/main/public/logo512.png",
          },
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/therealtimex/realtimex-crm",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          link: "/",
        },
        {
          label: "Users Documentation",
          autogenerate: { directory: "users" },
        },
        {
          label: "Developers Documentation",
          autogenerate: { directory: "developers" },
        },
      ],
    }),
  ],
});

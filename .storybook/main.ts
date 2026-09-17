import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import type { Alias } from "vite";

const dirname: string = path.dirname(fileURLToPath(import.meta.url));
const mocksDir: string = path.join(dirname, "mocks");

const config: StorybookConfig = {
  // Storybook 9 以降 addon-essentials / addon-interactions は core に統合済み。
  addons: ["@storybook/addon-themes"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: { configLoader: "runner" },
    },
  },
  stories: ["../src/**/*.stories.tsx"],
  typescript: {
    reactDocgen: "react-docgen",
  },
  /**
   * アプリ依存（Eden Treaty・TanStack Router）をモックへ差し替える。
   * 既存の @ → /src alias より先に一致させるため配列の先頭へ置く。
   */
  viteFinal: async (viteConfig) => {
    const currentAlias: Alias[] | Record<string, string> = viteConfig.resolve.alias ?? [];
    const merged: Alias[] = [
      { find: /^@\/lib\/api$/, replacement: path.join(mocksDir, "api.ts") },
      { find: /^@tanstack\/react-router$/, replacement: path.join(mocksDir, "react-router.tsx") },
    ];
    if (Array.isArray(currentAlias)) {
      merged.push(...currentAlias);
    } else {
      for (const [key, value] of Object.entries(currentAlias)) {
        merged.push({ find: key, replacement: value });
      }
    }
    viteConfig.resolve.alias = merged;
    return viteConfig;
  },
};

export default config;

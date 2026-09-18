import { createFileRoute } from "@tanstack/react-router";
import { type ReactElement } from "react";
import { Button, Card, CardTitle, ThemeSwitcher } from "reend-components";

import { CARD_ACCENTS, useCardAccent } from "@/lib/card-style";
import { type ThemeMode, useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const MODES: readonly { readonly label: string; readonly value: ThemeMode }[] = [
  { label: "SYSTEM", value: "system" },
  { label: "DARK", value: "dark" },
  { label: "LIGHT", value: "light" },
];

export function SettingsPage(): ReactElement {
  const { mode, setMode } = useTheme();
  const { accent, setAccent } = useCardAccent();
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-4">
        <CardTitle>APPEARANCE</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {MODES.map((item) => (
            <Button
              key={item.value}
              onClick={() => {
                setMode(item.value);
              }}
              size="sm"
              variant={item.value === mode ? "primary" : "ghost"}
            >
              {item.label}
            </Button>
          ))}
          <ThemeSwitcher aria-label="Toggle theme" />
        </div>
      </Card>
      <Card className="flex flex-col gap-4 p-4">
        <CardTitle>CARD ACCENT</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {CARD_ACCENTS.map((value) => (
            <Button
              key={value}
              onClick={() => {
                setAccent(value);
              }}
              size="sm"
              variant={value === accent ? "primary" : "ghost"}
            >
              {value.toUpperCase()}
            </Button>
          ))}
        </div>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
          カードのアクセント色は /export の URL にも反映されます。
        </p>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { type ReactElement, useState } from "react";
import { Button, Card, CopyClipboard, Tabs, TabsList, TabsTrigger } from "reend-components";

import {
  CARD_SIZES,
  type CardAccentName,
  type CardSize,
  type CardThemeName,
  cardTokens,
} from "@/cards/tokens";
import { CardPreview } from "@/components/card-preview";
import { SnapshotGate } from "@/components/snapshot-gate";
import { CARD_ACCENTS, useCardAccent, useResolvedCardTheme } from "@/lib/card-style";
import { formatSyncCaption } from "@/lib/format";
import { CARD_LABELS, CARD_TYPES, type CardType, isCardType } from "@/shared/cards";
import type { GithubSnapshot } from "@/shared/github";

export const Route = createFileRoute("/export")({ component: ExportPage });

type ThemeChoice = "auto" | CardThemeName;

const THEME_CHOICES: readonly ThemeChoice[] = ["auto", "dark", "light"];

interface CardUrlOptions {
  readonly accent: CardAccentName;
  readonly origin: string;
  readonly theme: CardThemeName;
  readonly type: CardType;
}

/** README に貼るカード URL を組み立てる。 */
function cardUrl(options: CardUrlOptions): string {
  return `${options.origin}/card/${options.type}?theme=${options.theme}&accent=${options.accent}`;
}

/** 単体の Markdown 画像。 */
function markdownOf(url: string, label: string): string {
  return `[![${label}](${url})](https://github.com)`;
}

interface PictureMarkdownOptions {
  readonly accent: CardAccentName;
  readonly label: string;
  readonly origin: string;
  readonly type: CardType;
}

/** ダーク / ライトを OS 設定で出し分ける <picture> 版。 */
function pictureMarkdown(options: PictureMarkdownOptions): string {
  const dark: string = cardUrl({ ...options, theme: "dark" });
  const light: string = cardUrl({ ...options, theme: "light" });
  const label: string = options.label;
  return [
    "<picture>",
    `  <source srcset="${dark}" media="(prefers-color-scheme: dark)" />`,
    `  <img src="${light}" alt="${label}" />`,
    "</picture>",
  ].join("\n");
}

interface PngDownloadOptions {
  readonly fileName: string;
  readonly height: number;
  readonly url: string;
  readonly width: number;
}

/** SVG を canvas へ描いて PNG として保存する（文字はパス化済みなのでフォント不要）。 */
function downloadPng(options: PngDownloadOptions): boolean {
  const image = new Image();
  image.addEventListener("load", () => {
    const canvas = document.createElement("canvas");
    canvas.width = options.width * 2;
    canvas.height = options.height * 2;
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }
    context.scale(2, 2);
    context.drawImage(image, 0, 0);
    canvas.toBlob((blob) => {
      if (blob === null) {
        return;
      }
      const objectUrl: string = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = options.fileName;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    }, "image/png");
  });
  image.src = options.url;
  return true;
}

interface ExportControlsProps {
  readonly accent: CardAccentName;
  readonly origin: string;
  readonly snapshot: GithubSnapshot;
  readonly type: CardType;
}

function ExportControls(props: ExportControlsProps): ReactElement {
  const [choice, setChoice] = useState<ThemeChoice>("auto");
  const resolved: CardThemeName = useResolvedCardTheme();
  const theme: CardThemeName = choice === "auto" ? resolved : choice;
  const tokens = cardTokens(theme, props.accent);
  const size: CardSize = CARD_SIZES[props.type] ?? { height: 220 };
  const url: string = cardUrl({
    accent: props.accent,
    origin: props.origin,
    theme,
    type: props.type,
  });
  const label: string = `${props.snapshot.stats.identity.login} ${CARD_LABELS[props.type]}`;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {THEME_CHOICES.map((value) => (
          <Button
            key={value}
            onClick={() => {
              setChoice(value);
            }}
            size="sm"
            variant={value === choice ? "primary" : "ghost"}
          >
            {value.toUpperCase()}
          </Button>
        ))}
      </div>
      <Card className="p-4">
        <CardPreview
          caption={formatSyncCaption(new Date().toISOString())}
          snapshot={props.snapshot}
          tokens={tokens}
          type={props.type}
        />
      </Card>
      <div className="flex flex-wrap gap-2">
        <CopyClipboard text={markdownOf(url, label)}>COPY MARKDOWN</CopyClipboard>
        <CopyClipboard
          text={pictureMarkdown({
            accent: props.accent,
            label,
            origin: props.origin,
            type: props.type,
          })}
        >
          COPY PICTURE TAG
        </CopyClipboard>
        <a href={url} target="_blank" rel="noreferrer">
          <Button size="sm" variant="secondary">
            OPEN SVG
          </Button>
        </a>
        <a download={`${props.type}.svg`} href={url}>
          <Button size="sm" variant="secondary">
            DOWNLOAD SVG
          </Button>
        </a>
        <Button
          onClick={() => {
            downloadPng({
              fileName: `${props.type}.png`,
              height: size.height,
              url,
              width: 480,
            });
          }}
          size="sm"
          variant="secondary"
        >
          DOWNLOAD PNG
        </Button>
      </div>
      <code className="block overflow-x-auto border border-border bg-surface-0 p-3 font-mono text-[10px] text-muted-foreground">
        {url}
      </code>
    </div>
  );
}

function ExportPage(): ReactElement {
  const { accent, setAccent } = useCardAccent();
  const [type, setType] = useState<CardType>("stats");
  const origin: string = globalThis.location?.origin ?? "https://your-worker.workers.dev";
  return (
    <SnapshotGate>
      {({ snapshot }) => (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              onValueChange={(value) => {
                if (isCardType(value)) {
                  setType(value);
                }
              }}
              value={type}
            >
              <TabsList>
                {CARD_TYPES.map((value) => (
                  <TabsTrigger key={value} value={value}>
                    {CARD_LABELS[value]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
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
          </div>
          <ExportControls accent={accent} origin={origin} snapshot={snapshot} type={type} />
        </div>
      )}
    </SnapshotGate>
  );
}

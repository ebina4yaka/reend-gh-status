import { type ReactElement } from "react";

import { buildCard } from "@/cards/build";
import { CARD_SIZES, CARD_WIDTH, type CardSize, type CardTokens } from "@/cards/tokens";
import type { CardType } from "@/shared/cards";
import type { GithubSnapshot } from "@/shared/github";

export interface CardPreviewProps {
  readonly caption: string;
  readonly snapshot: GithubSnapshot;
  readonly tokens: CardTokens;
  readonly type: CardType;
}

/**
 * 共有カード部品（satori と同じもの）をブラウザで表示する。
 * カードは 480px 固定なので、狭い画面では横スクロールで見せる。
 */
export function CardPreview(props: CardPreviewProps): ReactElement {
  const size: CardSize = CARD_SIZES[props.type] ?? { height: 220 };
  const card: ReactElement = buildCard({
    caption: props.caption,
    snapshot: props.snapshot,
    tokens: props.tokens,
    type: props.type,
  });
  return (
    <div className="max-w-full overflow-x-auto">
      <div style={{ height: size.height, width: CARD_WIDTH }}>{card}</div>
    </div>
  );
}

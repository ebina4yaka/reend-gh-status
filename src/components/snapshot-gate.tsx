import { type ReactElement, type ReactNode } from "react";
import { Alert, SkeletonCard } from "reend-components";

import { type SnapshotResult, useSnapshot } from "@/lib/snapshot";

export interface SnapshotGateProps {
  readonly children: (result: SnapshotResult) => ReactNode;
}

/** スナップショットの読み込み中・失敗を一箇所で扱う。 */
export function SnapshotGate(props: SnapshotGateProps): ReactElement {
  const query = useSnapshot();
  if (query.isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (query.isError) {
    return (
      <Alert title="SYNC FAILED" variant="error">
        {query.error instanceof Error ? query.error.message : "取得に失敗しました。"}
      </Alert>
    );
  }
  return <>{props.children(query.data)}</>;
}

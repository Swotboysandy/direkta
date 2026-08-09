"use client";

import type { Side } from "./edgeGeometry";

const SIDES: Side[] = ["n", "e", "s", "w"];

/**
 * The four side dots a node reveals on hover or single selection. Dragging from
 * any of them starts a connector; the drop lands anywhere on the target's body.
 *
 * v2's three fixed ports (in / out / attach) are gone. The port role never
 * participated in classification — both the client and the server derive an
 * edge's kind from the endpoint *types* — so replacing three role-bearing ports
 * with four geometric ones cost no classification logic and no server change.
 */
export function ConnectHandles() {
  return (
    <>
      {SIDES.map((s) => (
        <span key={s} className="stitch-conn" data-part="port" data-side={s} />
      ))}
    </>
  );
}

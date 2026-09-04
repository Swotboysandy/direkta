"use client";

import { motion } from "framer-motion";
import { AssetCanvas } from "../_components/AssetCanvas";
import { pageIn } from "../_components/motion";

interface Props {
  /** The scratch production every Create generation lands in. */
  projectId: string;
  assetsVersion: number;
}

/**
 * Create (brief §7, §14): generation with no production set up.
 *
 * The surface is deliberately quiet — the Dock below does the creating, and
 * what it makes appears here. Everything here belongs to a scratch
 * production rather than a film; moving a result into a production is what
 * "add to production" will do. Until that exists the copy says so, rather
 * than pretending.
 */
export function CreateHome({ projectId, assetsVersion }: Props) {
  return (
    <motion.div className="main-inner create" {...pageIn}>
      <header className="create-head">
        <p className="phome-kicker">Create</p>
        <h1 className="prods-title">Make something without a production</h1>
        <p className="create-lede">
          Describe a shot in the bar below and attach references with @. What you make lands here, outside any
          production, and can be brought into one later.
        </p>
      </header>
      <AssetCanvas projectId={projectId} assetsVersion={assetsVersion} />
    </motion.div>
  );
}

import { planFrames } from "../../animation/calculations/plan-frames";
import { animationLimits } from "../../animation/data/animation-limits";
import { checkFields } from "../../shared/check-fields";
import { fail } from "../../shared/fail";
import { ok } from "../../shared/ok";
import type { DiagramError, Result } from "../../shared/result";
import type { DiagramAnimation, EdgeAnimation, Fps, NodeAnimation } from "../data/diagram";
import { diagramLimits } from "../data/diagram-limits";

const FPS_VALUES: readonly unknown[] = [10, 20, 25];
const DEFAULT_FPS: Fps = 20;

type TargetRule = {
  readonly listPath: string;
  readonly idField: string;
  readonly ids: readonly string[];
  readonly effects: readonly string[];
  readonly limit: number;
};

export function validateAnimation(
  value: unknown,
  ids: { readonly nodeIds: readonly string[]; readonly edgeIds: readonly string[] },
): Result<DiagramAnimation> {
  const path = "animation";
  const { record, errors: fieldErrors } = checkFields(
    value,
    path,
    ["durationMs", "fps", "loop", "edges", "nodes"],
    ["durationMs"],
  );
  const errors = [...fieldErrors];
  if (record === null) {
    return fail(errors);
  }
  const fps = record.fps === undefined ? DEFAULT_FPS : record.fps;
  if (!FPS_VALUES.includes(fps)) {
    errors.push({ code: "invalid_fps", path: `${path}.fps` });
  }
  const loop = record.loop === undefined ? true : record.loop;
  if (typeof loop !== "boolean") {
    errors.push({ code: "invalid_type", path: `${path}.loop` });
  }
  const durationMs = record.durationMs;
  if (!Number.isInteger(durationMs) || (durationMs as number) <= 0) {
    errors.push({ code: "invalid_value", path: `${path}.durationMs` });
  } else if (FPS_VALUES.includes(fps) && !withinFrameLimits(durationMs as number, fps as Fps)) {
    errors.push({ code: "limit_exceeded", path: `${path}.durationMs` });
  }
  const edges = validateTargets(
    record.edges,
    {
      listPath: `${path}.edges`,
      idField: "edgeId",
      ids: ids.edgeIds,
      effects: ["dash", "packet"],
      limit: diagramLimits.edges,
    },
    errors,
  ) as unknown as readonly EdgeAnimation[];
  const nodes = validateTargets(
    record.nodes,
    {
      listPath: `${path}.nodes`,
      idField: "nodeId",
      ids: ids.nodeIds,
      effects: ["pulse"],
      limit: diagramLimits.nodes,
    },
    errors,
  ) as unknown as readonly NodeAnimation[];
  if (errors.length === 0 && edges.length === 0 && nodes.length === 0) {
    errors.push({ code: "empty_list", path });
  }
  if (errors.length > 0) {
    return fail(errors);
  }
  return ok({
    durationMs: durationMs as number,
    fps: fps as Fps,
    loop: loop as boolean,
    edges,
    nodes,
  });
}

function withinFrameLimits(durationMs: number, fps: Fps): boolean {
  const plan = planFrames(durationMs, fps);
  return (
    plan.frameCount <= animationLimits.frames && plan.totalDelayCs <= animationLimits.totalDelayCs
  );
}

function validateTargets(
  value: unknown,
  rule: TargetRule,
  errors: DiagramError[],
): readonly Readonly<Record<string, unknown>>[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    errors.push({ code: "invalid_type", path: rule.listPath });
    return [];
  }
  if (value.length > rule.limit) {
    errors.push({ code: "limit_exceeded", path: rule.listPath });
    return [];
  }
  const targets: Readonly<Record<string, unknown>>[] = [];
  const seen = new Set<string>();
  value.forEach((item: unknown, index) => {
    const path = `${rule.listPath}[${index}]`;
    const { record, errors: fieldErrors } = checkFields(
      item,
      path,
      [rule.idField, "effect"],
      [rule.idField, "effect"],
    );
    errors.push(...fieldErrors);
    if (record === null || fieldErrors.length > 0) {
      return;
    }
    if (!rule.ids.includes(record[rule.idField] as string)) {
      errors.push({ code: "unknown_reference", path: `${path}.${rule.idField}` });
    }
    if (!rule.effects.includes(record.effect as string)) {
      errors.push({ code: "unknown_effect", path: `${path}.effect` });
    }
    const key = `${record[rule.idField]}/${record.effect}`;
    if (seen.has(key)) {
      errors.push({ code: "duplicate_id", path });
    }
    seen.add(key);
    targets.push(record);
  });
  return targets;
}

export type EdgeDashState = { readonly edgeId: string; readonly dashOffset: number };

export type PacketState = {
  readonly edgeId: string;
  readonly x: number;
  readonly y: number;
  readonly angle: number;
};

export type NodePulseState = {
  readonly nodeId: string;
  readonly scale: number;
  readonly stroke: string;
};

export type FrameState = {
  readonly dashes: readonly EdgeDashState[];
  readonly packets: readonly PacketState[];
  readonly pulses: readonly NodePulseState[];
};

export type AnimationTimeline = {
  readonly durationMs: number;
  readonly accent: string;
  readonly dashes: readonly { readonly edgeId: string }[];
  readonly packets: readonly { readonly edgeId: string; readonly d: string }[];
  readonly pulses: readonly { readonly nodeId: string; readonly stroke: string }[];
};

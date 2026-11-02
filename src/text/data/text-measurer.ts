import type { Result } from "../../shared/result";

export type TextStyle = {
  readonly family: string;
  readonly weight: "regular" | "bold";
  readonly size: number;
};

export type TextMeasurer = {
  readonly measure: (text: string, style: TextStyle, path: string) => Result<number>;
};

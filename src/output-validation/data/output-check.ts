export type PngRule =
  | "png_too_large"
  | "png_bad_signature"
  | "png_truncated"
  | "png_ihdr_not_first"
  | "png_repeated_ihdr"
  | "png_dimensions"
  | "png_unknown_chunk"
  | "png_missing_idat"
  | "png_missing_iend"
  | "png_bad_iend"
  | "png_trailing_data";

export type GifRule =
  | "gif_too_large"
  | "gif_bad_signature"
  | "gif_truncated"
  | "gif_dimensions"
  | "gif_frame_count"
  | "gif_total_pixels"
  | "gif_frame_rectangle"
  | "gif_interlaced"
  | "gif_lzw_code"
  | "gif_delay"
  | "gif_total_delay"
  | "gif_bad_graphic_control"
  | "gif_bad_application"
  | "gif_comment"
  | "gif_plain_text"
  | "gif_unknown_block"
  | "gif_trailing_data";

export type OutputCheck<T, R> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly rule: R };

export type ExpectedSize = { readonly width: number; readonly height: number };

export type GifSummary = ExpectedSize & {
  readonly frames: number;
  readonly pixels: number;
  readonly totalDelayCs: number;
  readonly loop: boolean;
};

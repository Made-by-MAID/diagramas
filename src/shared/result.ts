export type ErrorCode =
  | "invalid_json"
  | "invalid_type"
  | "invalid_value"
  | "invalid_id"
  | "invalid_color"
  | "invalid_fps"
  | "unknown_field"
  | "unknown_version"
  | "unknown_type"
  | "unknown_shape"
  | "unknown_theme"
  | "unknown_font"
  | "unknown_effect"
  | "unknown_reference"
  | "missing_field"
  | "forbidden_key"
  | "duplicate_id"
  | "empty_list"
  | "control_character"
  | "limit_exceeded"
  | "font_unavailable"
  | "layout_failed"
  | "unsafe_svg"
  | "render_failed"
  | "render_timeout"
  | "attachment_too_large";

export type DiagramError = { readonly code: ErrorCode; readonly path: string };

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly DiagramError[] };

import { describe, expect, it } from "vitest";
import { buildFfmpegArgs } from "./build-ffmpeg-args";

const base = { framesDir: "/w", outputPath: "/w/out.gif", fps: 20, frameCount: 80, loop: true };

describe("buildFfmpegArgs", () => {
  it("uses the fixed argument list", () => {
    const result = buildFfmpegArgs(base);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.slice(0, 22)).toEqual([
      "-nostdin",
      "-protocol_whitelist",
      "file",
      "-f",
      "image2",
      "-c:v",
      "png",
      "-framerate",
      "20",
      "-i",
      "/w/%03d.png",
      "-frames:v",
      "80",
      "-map_metadata",
      "-1",
      "-map_chapters",
      "-1",
      "-fflags",
      "+bitexact",
      "-flags:v",
      "+bitexact",
      "-threads",
    ]);
    expect(result.value).toContain("/w/out.gif");
  });

  it("uses palettegen and paletteuse and none of the forbidden filters", () => {
    const result = buildFfmpegArgs(base);
    const joined = result.ok ? result.value.join(" ") : "";
    expect(joined).toContain("palettegen");
    expect(joined).toContain("paletteuse");
    for (const forbidden of ["drawtext", "movie", "lavfi", "concat"]) {
      expect(joined).not.toContain(forbidden);
    }
  });

  it("writes the loop as an integer", () => {
    const looping = buildFfmpegArgs(base);
    const once = buildFfmpegArgs({ ...base, loop: false });
    function loopValue(args: typeof looping) {
      return args.ok ? args.value[args.value.indexOf("-loop") + 1] : null;
    }
    expect(loopValue(looping)).toBe("0");
    expect(loopValue(once)).toBe("-1");
  });

  it.each([{ fps: 30 }, { fps: 20.5 }, { frameCount: 0 }, { frameCount: 81 }, { frameCount: 1.5 }])(
    "refuses values outside the validated integers: %j",
    (extra) => {
      expect(buildFfmpegArgs({ ...base, ...extra })).toEqual({
        ok: false,
        errors: [{ code: "limit_exceeded", path: "$" }],
      });
    },
  );
});

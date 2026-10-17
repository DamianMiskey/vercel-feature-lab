import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, checkUpload, isUploadName, sniffImage, uploadPathname } from "@/lib/uploads";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const gif = new TextEncoder().encode("GIF89a......");
const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const file = (bytes: Uint8Array, name: string, type: string) => new File([bytes as BlobPart], name, { type });

describe("sniffImage", () => {
  it("recognises PNG, JPEG, GIF and WebP from their bytes", () => {
    expect(sniffImage(png)?.type).toBe("image/png");
    expect(sniffImage(jpeg)?.type).toBe("image/jpeg");
    expect(sniffImage(gif)?.type).toBe("image/gif");
    expect(sniffImage(webp)?.type).toBe("image/webp");
  });

  it("refuses SVG and anything else", () => {
    expect(sniffImage(svg)).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<html>"))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe("checkUpload", () => {
  it("accepts a real image whatever it's called", async () => {
    const result = await checkUpload(file(png, "holiday.txt", "text/plain"));
    expect(result).toMatchObject({ ok: true, kind: { type: "image/png", ext: "png" } });
  });

  it("rejects a disguised file, an empty field and an oversized image", async () => {
    expect(await checkUpload(file(svg, "cat.png", "image/png"))).toMatchObject({ ok: false });
    expect(await checkUpload(null)).toMatchObject({ ok: false, error: "Choose an image first." });
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set(png);
    expect(await checkUpload(file(big, "big.png", "image/png"))).toMatchObject({ ok: false });
  });
});

describe("upload names", () => {
  it("generates names the file route accepts, and nothing else gets through", () => {
    const name = uploadPathname("png").replace("uploads/", "");
    expect(isUploadName(name)).toBe(true);
    for (const bad of ["../secret.png", "x.png", `${crypto.randomUUID()}.svg`, `${crypto.randomUUID()}.png/../a`]) {
      expect(isUploadName(bad), bad).toBe(false);
    }
  });
});

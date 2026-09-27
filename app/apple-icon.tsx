import { renderIcon } from "@/lib/pwa/icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // iOS applies its own rounded mask, so draw a full-bleed square.
  return renderIcon(180, { maskable: true });
}

"use client";

import { useEffect, useRef } from "react";
import styles from "./leaf-scene.module.css";

type LeafSceneProps = {
  className?: string;
  variant?: "hero" | "ambient";
  paused?: boolean;
  interactive?: boolean;
};

type Leaf = {
  angle: number;
  radius: number;
  depth: number;
  phase: number;
  rotation: number;
  speed: number;
  sprite: number;
  x: number;
  y: number;
};

const PALETTES = [
  ["#173f2d", "#47744d", "#839765", "#c1ce95"],
  ["#315437", "#79905a", "#a8b77d", "#d6dda9"],
  ["#1e4338", "#4b7562", "#839e83", "#bbcbb2"],
  ["#516638", "#8a9b51", "#b7bf76", "#e0deaa"],
] as const;

function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Paint once at generous resolution; animation only composites cached sprites. */
function makeLeafSprite(shape: number, palette: (typeof PALETTES)[number]) {
  const sprite = document.createElement("canvas");
  sprite.width = 180;
  sprite.height = 256;
  const context = sprite.getContext("2d");
  if (!context) return sprite;

  context.translate(90, 127);
  const silhouette = new Path2D();
  silhouette.moveTo(4, -104);
  if (shape === 0) {
    // A slender, gently curved willow blade.
    silhouette.bezierCurveTo(55, -53, 41, 54, -6, 91);
    silhouette.bezierCurveTo(-41, 49, -43, -20, 4, -104);
  } else if (shape === 1) {
    // The broad shoulders and tapering base of a beech leaf.
    silhouette.bezierCurveTo(24, -65, 62, -44, 57, -5);
    silhouette.bezierCurveTo(59, 39, 21, 72, -6, 92);
    silhouette.bezierCurveTo(-40, 64, -67, 30, -53, -16);
    silhouette.bezierCurveTo(-48, -48, -17, -75, 4, -104);
  } else {
    // A softer, asymmetric oval eucalyptus leaf.
    silhouette.bezierCurveTo(56, -84, 69, -32, 48, 18);
    silhouette.bezierCurveTo(35, 57, 11, 76, -6, 90);
    silhouette.bezierCurveTo(-42, 51, -54, 2, -47, -43);
    silhouette.bezierCurveTo(-43, -78, -17, -98, 4, -104);
  }
  silhouette.closePath();

  context.save();
  context.shadowColor = "rgba(25, 52, 25, .16)";
  context.shadowBlur = 7;
  context.shadowOffsetX = 3;
  context.shadowOffsetY = 6;
  context.fillStyle = palette[1];
  context.fill(silhouette);
  context.restore();

  context.save();
  context.clip(silhouette);
  const blade = context.createLinearGradient(-57, 17, 62, -12);
  blade.addColorStop(0, palette[0]);
  blade.addColorStop(0.39, palette[1]);
  blade.addColorStop(0.49, palette[2]);
  blade.addColorStop(0.54, palette[1]);
  blade.addColorStop(0.86, palette[2]);
  blade.addColorStop(1, palette[1]);
  context.fillStyle = blade;
  context.fillRect(-75, -115, 150, 225);

  const light = context.createRadialGradient(-14, -57, 2, -2, -33, 122);
  light.addColorStop(0, "rgba(238, 246, 187, .24)");
  light.addColorStop(0.5, "rgba(215, 239, 164, .04)");
  light.addColorStop(1, "rgba(6, 35, 21, .28)");
  context.fillStyle = light;
  context.fillRect(-75, -115, 150, 225);

  // Fine curved veins follow the blade rather than reading as an icon outline.
  context.strokeStyle = palette[3];
  context.lineWidth = 0.8;
  context.globalAlpha = 0.23;
  for (let index = 0; index < 9; index++) {
    const y = -64 + index * 17;
    const spread = Math.sin(((y + 100) / 202) * Math.PI) * (shape === 0 ? 34 : 57);
    const center = -2 - y * 0.035;
    context.beginPath();
    context.moveTo(center, y + 6);
    context.quadraticCurveTo(-spread * 0.45, y - 5, -spread, y - 26);
    context.moveTo(center, y + 6);
    context.quadraticCurveTo(spread * 0.5, y - 3, spread, y - 22);
    context.stroke();
  }
  context.globalAlpha = 0.52;
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(4, -101);
  context.bezierCurveTo(-3, -40, 2, 32, -7, 91);
  context.stroke();
  context.restore();

  context.strokeStyle = palette[1];
  context.lineWidth = 2.1;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-6, 86);
  context.quadraticCurveTo(-8, 105, -15, 115);
  context.stroke();
  return sprite;
}

/** A quiet, dimensional canopy. The containing section retains all pointer input. */
export function LeafScene({
  className,
  variant = "hero",
  paused = false,
  interactive = true,
}: LeafSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = canvas?.parentElement;
    const surface = wrapper?.closest("section") ?? wrapper?.parentElement;
    if (!canvas || !wrapper || !surface) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const random = seededRandom(variant === "hero" ? 851039 : 220619);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sprites = PALETTES.flatMap((palette) => [0, 1, 2].map((shape) => makeLeafSprite(shape, palette)));
    // Deliberate foreground placement gives the canopy shape at every viewport.
    // The smaller leaves fill its depth with a loose, rising spiral.
    const foregroundPositions = [
      [0.83, 0.19], [0.66, 0.27], [0.94, 0.34], [0.71, 0.43],
      [0.84, 0.5], [1.015, 0.58], [0.645, 0.63], [0.8, 0.74],
      [0.95, 0.86], [0.555, 0.82], [0.74, 0.92], [1.01, 0.13],
      [0.875, 0.365], [0.755, 0.575], [0.915, 0.675],
    ];
    const leaves: Leaf[] = Array.from({ length: variant === "hero" ? 104 : 42 }, (_, index) => {
      const foreground = index < (variant === "hero" ? foregroundPositions.length : 5);
      const angle = random() * Math.PI * 2;
      const spread = Math.sqrt(random());
      const anchor = variant === "hero" && foreground ? foregroundPositions[index] : null;
      return {
        angle,
        radius: foreground ? 0.73 + random() * 0.54 : 0.62 + random() * 0.84,
        depth: foreground ? 0.8 + random() * 0.2 : 0.06 + random() * 0.7,
        phase: random() * Math.PI * 2,
        rotation: angle + random() * 1.5,
        speed: 0.55 + random() * 0.75,
        sprite: Math.floor(random() * sprites.length),
        x: anchor?.[0] ?? 0.795 + Math.cos(angle) * spread * 0.24 + Math.sin(angle) * 0.045,
        y: anchor?.[1] ?? 0.49 + Math.sin(angle) * spread * 0.385,
      };
    }).sort((a, b) => a.depth - b.depth);

    let width = 1;
    let height = 1;
    let ratio = 1;
    let frame = 0;
    let elapsed = 0;
    let lastFrame = 0;
    let visible = true;
    let disposed = false;
    let pointerDown = false;
    let pointerLastX = 0;
    let pointerLastY = 0;
    let windX = 0;
    let windY = 0;
    const target = { x: 0, y: 0 };
    const camera = { x: 0, y: 0 };

    function draw() {
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const smallScreen = width < 640;
      const scale = Math.min(1.24, Math.max(0.72, width / 1400));
      const sceneOpacity = variant === "ambient" ? 0.48 : 1;
      const centerX = width * 0.5;
      const centerY = height * 0.48;

      for (const leaf of leaves) {
        const depth = leaf.depth;
        const time = elapsed * leaf.speed;
        // The hero fills the right side with a sculptural canopy. Ambient scenes
        // retain an open elliptical center so they can sit behind centered copy.
        const angle = leaf.angle + Math.sin(time * 0.07 + leaf.phase) * 0.12;
        const radius = leaf.radius + Math.sin(time * 0.12 + leaf.phase) * 0.035;
        const orbitX = Math.cos(angle) * radius * width * (smallScreen ? 0.62 : 0.57);
        const orbitY = Math.sin(angle) * radius * height * 0.64;
        const driftX = Math.sin(time * 0.27 + leaf.phase) * (7 + depth * 30);
        const driftY = Math.cos(time * 0.21 + leaf.phase) * (8 + depth * 33);
        const parallax = 5 + depth * depth * 48;
        const baseX = variant === "hero" ? leaf.x * width : centerX + orbitX;
        const baseY = variant === "hero" ? (leaf.y + (smallScreen ? 0.025 : 0)) * height : centerY + orbitY;
        const x = baseX + driftX - camera.x * parallax + windX * depth * 20;
        const y = baseY + driftY - camera.y * parallax + windY * depth * 15;
        const size = (5 + Math.pow(depth, 2.4) * (variant === "hero" ? 139 : 83)) * scale;
        if (x < -size || x > width + size || y < -size || y > height + size) continue;

        const rotation = leaf.rotation + Math.sin(time * 0.23 + leaf.phase) * 0.6 + time * 0.055;
        const tilt = 0.4 + Math.abs(Math.cos(time * 0.19 + leaf.phase)) * 0.6;
        // Fade only the left edge of the hero field, keeping every word quiet.
        const readingFade = variant === "hero" ? Math.min(1, Math.max(0, (x / width - 0.43) / 0.16)) : 1;
        const alpha = (0.2 + depth * 0.71) * sceneOpacity * readingFade;
        context.save();
        context.translate(x, y);
        context.rotate(rotation + windX * 0.07);
        context.scale(tilt, 1);
        context.globalAlpha = alpha;
        context.drawImage(sprites[leaf.sprite], -size * 0.352, -size * 0.5, size * 0.704, size);
        context.restore();
      }
      context.globalAlpha = 1;
    }

    function canAnimate() {
      return !disposed && visible && !document.hidden && !pausedRef.current && !media.matches;
    }

    function animate(now: number) {
      frame = 0;
      if (!canAnimate()) return;
      // The scene composites at 30 fps. Cached leaves avoid per-frame gradients,
      // path construction, filters, and layout measurements.
      if (now - lastFrame >= 1000 / 30) {
        const delta = Math.min((now - lastFrame) / 1000, 0.05);
        lastFrame = now;
        elapsed += delta;
        const ease = 1 - Math.exp(-delta * 3.5);
        camera.x += (target.x - camera.x) * ease;
        camera.y += (target.y - camera.y) * ease;
        windX *= Math.exp(-delta * 1.4);
        windY *= Math.exp(-delta * 1.4);
        draw();
      }
      frame = window.requestAnimationFrame(animate);
    }

    function sync() {
      if (canAnimate()) {
        if (!frame) {
          lastFrame = performance.now();
          frame = window.requestAnimationFrame(animate);
        }
      } else if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    function resize() {
      if (!canvas || !wrapper || disposed) return;
      const bounds = wrapper.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      draw();
    }

    function move(event: PointerEvent) {
      if (!interactive || pausedRef.current || media.matches || !wrapper) return;
      const bounds = wrapper.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      target.y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
      if (pointerDown) {
        windX = Math.max(-3, Math.min(3, windX + (event.clientX - pointerLastX) * 0.012));
        windY = Math.max(-3, Math.min(3, windY + (event.clientY - pointerLastY) * 0.012));
      }
      pointerLastX = event.clientX;
      pointerLastY = event.clientY;
    }

    function down(event: PointerEvent) {
      // Do not treat ordinary control clicks as a gesture or suppress page scrolling.
      if ((event.target as Element).closest("a, button, input, select, textarea, [role='button']")) return;
      pointerDown = true;
      pointerLastX = event.clientX;
      pointerLastY = event.clientY;
    }

    function up() {
      pointerDown = false;
    }

    function leave() {
      pointerDown = false;
      target.x = 0;
      target.y = 0;
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrapper);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { rootMargin: "80px" });
    intersectionObserver.observe(wrapper);
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    if (interactive) {
      surface.addEventListener("pointermove", move, { passive: true });
      surface.addEventListener("pointerdown", down, { passive: true });
      surface.addEventListener("pointerleave", leave, { passive: true });
      window.addEventListener("pointerup", up, { passive: true });
      window.addEventListener("pointercancel", up, { passive: true });
    }
    syncRef.current = sync;
    resize();
    sync();

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      syncRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerdown", down);
      surface.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [interactive, variant]);

  return (
    <div className={[styles.scene, className].filter(Boolean).join(" ")} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

export default LeafScene;

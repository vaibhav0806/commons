"use client";

import { useEffect, useRef } from "react";

export function ContextField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const context = node.getContext("2d");
    if (!context) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = false;
    let width = 0;
    let height = 0;
    let elapsed = 0;
    let previous = 0;
    const pointer = { x: 0, y: 0 };
    function draw(time: number) {
      if (!context) return;
      if (previous) elapsed += Math.min(time - previous, 40);
      previous = time;
      const t = media.matches ? 0 : elapsed / 1000;
      context.clearRect(0, 0, width, height);
      const radius = Math.min(width, height) * 0.34;
      const angle = -0.16 + Math.sin(t * 0.16) * 0.09;
      for (let lobe = 0; lobe < 4; lobe++) {
        const cx = (lobe % 2 ? 1 : -1) * radius * 0.55;
        const cy = (lobe < 2 ? -1 : 1) * radius * 0.55;
        for (let row = -15; row <= 15; row++) {
          for (let col = -15; col <= 15; col++) {
            const u = col / 15;
            const v = row / 15;
            if (Math.pow(Math.abs(u), 4) + Math.pow(Math.abs(v), 4) > 1)
              continue;
            const wave = Math.sin(u * 3 + v * 2 + t * 0.7 + lobe);
            const x = cx + u * radius * 0.45;
            const y = cy + v * radius * 0.45;
            const depth = Math.sqrt(Math.max(0, 1 - u * u * 0.5 - v * v * 0.5));
            const px =
              width / 2 +
              x * Math.cos(angle) -
              y * Math.sin(angle) +
              pointer.x * depth * 9;
            const py =
              height / 2 +
              x * Math.sin(angle) +
              y * Math.cos(angle) +
              wave * 5 +
              pointer.y * depth * 9;
            const sheen = Math.pow(Math.max(0, Math.sin(u + v + t * 0.45)), 8);
            context.fillStyle = `rgba(200,216,236,${(0.18 + depth * 0.33 + sheen * 0.42) * 0.34})`;
            context.beginPath();
            context.arc(px, py, 0.65 + sheen * 0.5, 0, Math.PI * 2);
            context.fill();
          }
        }
      }
      if (visible && !document.hidden && !media.matches)
        frame = requestAnimationFrame(draw);
    }
    function resume() {
      cancelAnimationFrame(frame);
      previous = 0;
      if (visible && !document.hidden) draw(performance.now());
    }
    const resize = new ResizeObserver(() => {
      const box = node.getBoundingClientRect();
      width = box.width;
      height = box.height;
      const ratio = Math.min(devicePixelRatio, 2);
      node.width = width * ratio;
      node.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      resume();
    });
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    function move(event: PointerEvent) {
      if (media.matches) return;
      const box = node!.getBoundingClientRect();
      pointer.x = (event.clientX - box.left) / box.width - 0.5;
      pointer.y = (event.clientY - box.top) / box.height - 0.5;
    }
    const parent = node.parentElement;
    parent?.addEventListener("pointermove", move);
    resize.observe(node);
    observer.observe(node);
    document.addEventListener("visibilitychange", resume);
    media.addEventListener("change", resume);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      parent?.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", resume);
      media.removeEventListener("change", resume);
    };
  }, []);
  return (
    <canvas
      ref={canvas}
      className="context-field context-field-quiet"
      aria-hidden="true"
    />
  );
}

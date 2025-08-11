"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

interface CarouselProps {
  images: string[];
  intervalMs?: number;
  transitionMs?: number;
}

export default function Carousel({ images, intervalMs = 11000, transitionMs = 2000 }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const safeImages = useMemo(() => images.filter(Boolean), [images]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || safeImages.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => {
        if (safeImages.length <= 1) return prev;
        let next = Math.floor(Math.random() * safeImages.length);
        if (next === prev) next = (prev + 1) % safeImages.length;
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [mounted, safeImages, intervalMs]);

  const fallback = safeImages[0] ?? "/images/carousel/adobe_copepod.jpeg";

  return (
    <div className="absolute inset-0 overflow-hidden bg-base-100">
      {(mounted ? safeImages : [fallback]).map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="absolute inset-0 transition-opacity"
          style={{
            opacity: mounted ? (index === activeIndex ? 1 : 0) : 1,
            transitionDuration: `${transitionMs}ms`,
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)"
          }}
          aria-hidden={mounted ? index !== activeIndex : false}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={mounted ? index === activeIndex : true}
            className="object-cover opacity-85 dark:opacity-70 filter contrast-[1.06] saturate-[1.04] dark:contrast-100 dark:saturate-100"
            sizes="100vw"
          />
        </div>
      ))}
    </div>
  );
} 
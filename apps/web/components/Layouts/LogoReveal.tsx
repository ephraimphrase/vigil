"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./LogoReveal.module.css";

export function LogoReveal() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetX = (e.clientX - window.innerWidth / 2) / 26;
      targetY = (e.clientY - window.innerHeight / 2) / 26;
    };
    const onLeave = () => { targetX = 0; targetY = 0; };

    function loop() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      stage!.style.transform = `rotateY(${curX}deg) rotateX(${-curY}deg)`;
      raf = requestAnimationFrame(loop);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={stageRef} className={styles.stage}>
      <div className={styles.pulseRing} />
      <div className={styles.pulseRing} />
      <div className={styles.pulseRing} />

      <div className={styles.halo}>
        <svg viewBox="0 0 220 220">
          <defs>
            <linearGradient id="halo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
              <stop offset="50%" stopColor="#d9cdff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="110" cy="110" r="108" className={styles.haloArc} />
        </svg>
      </div>

      <div className={styles.groundShadow} />

      <div className={styles.mark}>
        <div className={styles.rim} />
        <div className={styles.sheen} />
        <Image src="/logo.png" alt="Vigil" fill sizes="86px" className={styles.markImg} priority />
      </div>
    </div>
  );
}

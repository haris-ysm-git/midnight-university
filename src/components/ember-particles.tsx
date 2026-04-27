"use client";

import { useEffect, useRef } from "react";

export function EmberParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width: number;
    let height: number;

    const particles: Particle[] = [];
    const particleCount = 18; // Reduced count for less distraction

    class Particle {
      x!: number;
      y!: number;
      size!: number;
      speedX!: number;
      speedY!: number;
      opacity!: number;
      life!: number;
      maxLife!: number;

      constructor() {
        this.maxLife = 150 + Math.random() * 250; // Longer life for slower drift
        this.reset();
      }

      reset() {
        // Start from bottom or right side
        if (Math.random() > 0.5) {
          this.x = width + Math.random() * 20;
          this.y = Math.random() * height;
        } else {
          this.x = Math.random() * width;
          this.y = height + Math.random() * 20;
        }
        
        this.size = 0.3 + Math.random() * 1.2; // Smaller dots
        // Slower movement towards top-left
        this.speedX = -(0.2 + Math.random() * 0.8);
        this.speedY = -(0.2 + Math.random() * 0.8);
        this.opacity = 0;
        this.life = 0;
      }

      update() {
        this.x += this.speedX + (Math.sin(this.life / 30) * 0.1); // Gentler wobble
        this.y += this.speedY;
        this.life++;

        if (this.life < 40) {
          this.opacity += 0.02; // Slower fade in
        } else if (this.life > this.maxLife - 60) {
          this.opacity -= 0.01; // Slower fade out
        }

        if (this.life >= this.maxLife || this.x < -10 || this.y < -10) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(200, 168, 130, ${Math.max(0, this.opacity * 0.35)})`; // Dimmer particles
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      init();
    };

    init();
    animate();

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9998]"
      style={{ opacity: 0.8 }}
    />
  );
}

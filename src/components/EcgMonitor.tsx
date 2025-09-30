import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

interface ECGMonitorProps {
  width?: number;
  height?: number;
  color?: string;
  beatInterval?: number;
  dead?: boolean;
}

interface ECGMonitorHandle {
  triggerBeat: () => void;
}

export const ECGMonitor = forwardRef<ECGMonitorHandle, ECGMonitorProps>(({ width = 130, height = 50, color = "#22ff22", beatInterval = 1000, dead = false }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const beatIntervalRef = useRef<number | null>(null);
  const dataRef = useRef({
    heartData: [0, 0, 0, 0, 0],
    heartDataIndex: 0,
    beatDataIndex: -1,
    BANG: false,
  });

  const INTERVAL = 20;

  useImperativeHandle(ref, () => ({
    triggerBeat: () => {
      dataRef.current.BANG = true;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const data = dataRef.current;

    function fillHeartData(length: number) {
      if (length !== data.heartData.length) {
        data.heartData = new Array(length);
        for (let i = 0; i < length; i++) {
          data.heartData[i] = 0;
        }
      }
    }

    function fillBeatData() {
      const getValue = function (idx: number) {
        return idx === 0
          ? Math.random() * 0.1 + 0.1
          : idx === 1
          ? Math.random() * 0.1 + 0.0
          : idx === 2
          ? Math.random() * 0.3 + 0.7
          : idx === 3
          ? Math.random() * 0.1 - 0.05
          : idx === 4
          ? Math.random() * 0.3 - 0.8
          : idx === 5
          ? Math.random() * 0.1 - 0.05
          : idx === 6
          ? Math.random() * 0.1 - 0.05
          : idx === 7
          ? Math.random() * 0.1 + 0.15
          : 0;
      };
      data.heartData[data.heartDataIndex] = getValue(data.beatDataIndex);
      data.beatDataIndex++;
      if (data.beatDataIndex > 7) {
        data.beatDataIndex = -1;
      }
    }

    function fillRandomData() {
      data.heartData[data.heartDataIndex] = Math.random() * 0.1 - 0.025;
    }

    function updateData() {
      data.heartDataIndex++;
      if (data.heartDataIndex >= data.heartData.length) {
        data.heartDataIndex = 0;
      }
      if (data.beatDataIndex >= 0 || data.BANG) {
        fillBeatData();
        data.BANG = false;
      } else {
        fillRandomData();
      }
    }

    function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, b: number) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(x, y);
      ctx.scale(a / b, 1);
      ctx.arc(0, 0, b, 0, Math.PI * 2, true);
      ctx.restore();
      ctx.closePath();
    }

    function onPaint() {
      context.clearRect(0, 0, width, height);
      const baseY = height / 2;
      const length = data.heartData.length;
      const step = (width - 5) / length;
      const yFactor = dead ? 0 : height * (0.2 + (1000 - beatInterval) / 2500);
      let heartIndex = (data.heartDataIndex + 1) % length;
      context.strokeStyle = color;
      context.beginPath();
      context.moveTo(0, baseY);
      let i = 0,
        x = 0,
        y = 0;
      for (i = 0; i < length; i++) {
        x = i * step;
        y = baseY - data.heartData[heartIndex] * yFactor;
        context.lineTo(x, y);
        heartIndex = (heartIndex + 1) % length;
      }
      context.stroke();
      context.closePath();
      context.beginPath();
      context.fillStyle = color;
      ellipse(context, x - 1, y - 1, 2, 2);
      context.fill();
      context.closePath();
    }

    function startAnimations() {
      // Clear any existing intervals
      if (animationRef.current) clearInterval(animationRef.current);
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);

      // Start animation loop
      animationRef.current = window.setInterval(() => {
        updateData();
        onPaint();
      }, INTERVAL);

      // Start beat interval
      if (beatInterval > 0) {
        beatIntervalRef.current = window.setInterval(() => {
          dataRef.current.BANG = true;
        }, beatInterval + Math.random() * 20);
      }
    }

    function stopAnimations() {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopAnimations();
      } else {
        startAnimations();
      }
    }

    fillHeartData(Math.max(100, Math.floor(width * 0.5)));

    // Start animations initially
    startAnimations();

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopAnimations();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [width, height, color, beatInterval, dead]);

  return <canvas ref={canvasRef} width={width} height={height} />;
});

ECGMonitor.displayName = "ECGMonitor";

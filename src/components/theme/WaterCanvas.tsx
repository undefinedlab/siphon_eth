"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  simulationVertexShader,
  simulationFragmentShader,
  renderVertexShader,
  renderFragmentShader,
} from "@/lib/shaders";

export default function SoftHorizonCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const scene = new THREE.Scene();
    const simScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const mountTarget = containerRef.current ?? document.body;
    mountTarget.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2();
    let frame = 0;

    const getWidth = () => window.innerWidth * window.devicePixelRatio;
    const getHeight = () => window.innerHeight * window.devicePixelRatio;

    let width = getWidth();
    let height = getHeight();

    const options: THREE.RenderTargetOptions = {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      stencilBuffer: false,
      depthBuffer: false,
    };
    let rtA = new THREE.WebGLRenderTarget(width, height, options);
    let rtB = new THREE.WebGLRenderTarget(width, height, options);

    const simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        textureA: { value: null },
        mouse: { value: mouse },
        resolution: { value: new THREE.Vector2(width, height) },
        time: { value: 0 },
        frame: { value: 0 },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentShader,
    });

    const renderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        textureA: { value: null },
        textureB: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        time: { value: 0 },
      },
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
      transparent: true,
    });

    const plane = new THREE.PlaneGeometry(2, 2);
    const simQuad = new THREE.Mesh(plane, simMaterial);
    const renderQuad = new THREE.Mesh(plane, renderMaterial);

    simScene.add(simQuad);
    scene.add(renderQuad);

    const canvas2d = document.createElement("canvas");
    canvas2d.width = width;
    canvas2d.height = height;
    const ctx = canvas2d.getContext("2d", { alpha: true });
    if (!ctx) return () => {};

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    const mainFontSize = Math.round(200 * window.devicePixelRatio);
    const subtitleFontSize = Math.round(24 * window.devicePixelRatio);
    const logoSize = Math.round(120 * window.devicePixelRatio);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${mainFontSize}px Source Code Pro`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.textRendering = "geometricPrecision" as CanvasTextRendering;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    
    // Calculate text width to position logo
    const textMetrics = ctx.measureText("siphon");
    const textWidth = textMetrics.width;
    const logoTextGap = 30 * window.devicePixelRatio;
    
    // Draw SVG logo to the left of text, positioned higher
    ctx.save();
    ctx.translate(width / 2 - textWidth / 2 - logoSize - logoTextGap, height / 2 - 50);
    ctx.scale(logoSize / 97.34, logoSize / 80);
    
    // SVG path data
    const svgPath = new Path2D("M70.66,35.93a11.66,11.66,0,0,1,1,.83c1.84,1.89,3.69,3.78,5.5,5.7,2.24,2.35,2.14,1.66-.06,3.9-4.47,4.53-9,9-13.49,13.49-1,1-1,1.09-.16,1.95q7.47,7.5,15,15c.85.85,1,.85,1.83,0q7.5-7.47,15-15c.84-.85.83-1,0-1.84-1.58-1.61-3.2-3.2-4.8-4.8l-9.72-9.73c-1.05-1-1-1.07,0-2.14.07-.08.15-.15.23-.23L92.22,32c1.5-1.47,3-2.94,4.49-4.43.86-.87.84-.9,0-1.81-.14-.16-.3-.3-.46-.46L81.59,10.63Q76.67,5.71,71.75.8c-1.07-1.07-1.09-1.07-2.17,0L64.82,5.66,37.45,33.19q-5.19,5.22-10.38,10.43c-.88.88-.9.87-1.77,0S23.83,42,23.08,41.26c-1.46-1.5-2.95-3-4.41-4.5-1.05-1.1-1-1.11,0-2.16l.23-.23Q25.94,27.28,33,20.19c1.08-1.08,1.09-1.08,0-2.16q-4.27-4.31-8.56-8.59c-2.06-2.06-4.11-4.13-6.18-6.17-.94-.93-1-.91-1.95,0-.2.18-.39.37-.58.56q-6.52,6.53-13,13c-.46.46-.92.91-1.36,1.38-.74.81-.73.88,0,1.73.18.2.37.38.56.57l8.81,8.81c1.83,1.83,3.64,3.67,5.49,5.49.54.52.62.95,0,1.46-.33.28-.62.61-.92.91L.85,51.75a3.65,3.65,0,0,0-.76.82,1.43,1.43,0,0,0,0,1c.1.28.42.48.64.71q12,12.45,24.05,24.89c1.1,1.14,1.11,1.14,2.28,0l29.48-29.3,13.2-13.1C70,36.47,70.3,36.24,70.66,35.93Z");
    ctx.fillStyle = "#ffffff";
    ctx.fill(svgPath);
    ctx.restore();
    
    // Main title
    ctx.fillText("siphon", width / 2, height / 2);
    
    // Subtitle
    ctx.font = `${subtitleFontSize}px Source Code Pro`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("trade without a trace.", width / 2 + 120, height / 2 + mainFontSize * 0.4);

    const textTexture = new THREE.CanvasTexture(canvas2d);
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.magFilter = THREE.LinearFilter;
    textTexture.format = THREE.RGBAFormat;

    const onResize = () => {
      width = getWidth();
      height = getHeight();
      renderer.setSize(window.innerWidth, window.innerHeight);
      rtA.setSize(width, height);
      rtB.setSize(width, height);
      (simMaterial.uniforms.resolution.value as THREE.Vector2).set(
        width,
        height
      );

      canvas2d.width = width;
      canvas2d.height = height;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const newMainFontSize = Math.round(200 * window.devicePixelRatio);
      const newSubtitleFontSize = Math.round(24 * window.devicePixelRatio);
      const newLogoSize = Math.round(120 * window.devicePixelRatio);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${newMainFontSize}px Source Code Pro`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Calculate text width to position logo
      const textMetrics = ctx.measureText("siphon");
      const textWidth = textMetrics.width;
      const logoTextGap = 30 * window.devicePixelRatio;
      
      // Draw SVG logo to the left of text, positioned higher
      ctx.save();
      ctx.translate(width / 2 - textWidth / 2 - newLogoSize - logoTextGap, height / 2 - 50);
      ctx.scale(newLogoSize / 97.34, newLogoSize / 80);
      
      // SVG path data
      const svgPath = new Path2D("M70.66,35.93a11.66,11.66,0,0,1,1,.83c1.84,1.89,3.69,3.78,5.5,5.7,2.24,2.35,2.14,1.66-.06,3.9-4.47,4.53-9,9-13.49,13.49-1,1-1,1.09-.16,1.95q7.47,7.5,15,15c.85.85,1,.85,1.83,0q7.5-7.47,15-15c.84-.85.83-1,0-1.84-1.58-1.61-3.2-3.2-4.8-4.8l-9.72-9.73c-1.05-1-1-1.07,0-2.14.07-.08.15-.15.23-.23L92.22,32c1.5-1.47,3-2.94,4.49-4.43.86-.87.84-.9,0-1.81-.14-.16-.3-.3-.46-.46L81.59,10.63Q76.67,5.71,71.75.8c-1.07-1.07-1.09-1.07-2.17,0L64.82,5.66,37.45,33.19q-5.19,5.22-10.38,10.43c-.88.88-.9.87-1.77,0S23.83,42,23.08,41.26c-1.46-1.5-2.95-3-4.41-4.5-1.05-1.1-1-1.11,0-2.16l.23-.23Q25.94,27.28,33,20.19c1.08-1.08,1.09-1.08,0-2.16q-4.27-4.31-8.56-8.59c-2.06-2.06-4.11-4.13-6.18-6.17-.94-.93-1-.91-1.95,0-.2.18-.39.37-.58.56q-6.52,6.53-13,13c-.46.46-.92.91-1.36,1.38-.74.81-.73.88,0,1.73.18.2.37.38.56.57l8.81,8.81c1.83,1.83,3.64,3.67,5.49,5.49.54.52.62.95,0,1.46-.33.28-.62.61-.92.91L.85,51.75a3.65,3.65,0,0,0-.76.82,1.43,1.43,0,0,0,0,1c.1.28.42.48.64.71q12,12.45,24.05,24.89c1.1,1.14,1.11,1.14,2.28,0l29.48-29.3,13.2-13.1C70,36.47,70.3,36.24,70.66,35.93Z");
      ctx.fillStyle = "#ffffff";
      ctx.fill(svgPath);
      ctx.restore();
      
      // Main title
      ctx.fillText("siphon", width / 2, height / 2);
      
      // Subtitle
      ctx.font = `${newSubtitleFontSize}px Source Code Pro`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Trade anywhere, visible nowhere.", width / 2 + 40, height / 2 + newMainFontSize * 0.4);
      
      textTexture.needsUpdate = true;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX * window.devicePixelRatio;
      mouse.y = (window.innerHeight - e.clientY) * window.devicePixelRatio;
    };
    const onMouseLeave = () => {
      mouse.set(0, 0);
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", onResize);

    let rafId = 0;
    const animate = () => {
      const currentTime = performance.now() / 1000;
      (simMaterial.uniforms.frame.value as number) = frame++;
      (simMaterial.uniforms.time.value as number) = currentTime;
      (renderMaterial.uniforms.time.value as number) = currentTime;

      (simMaterial.uniforms.textureA.value as THREE.Texture) = rtA.texture;
      renderer.setRenderTarget(rtB);
      renderer.render(simScene, camera);

      (renderMaterial.uniforms.textureA.value as THREE.Texture) = rtB.texture;
      (renderMaterial.uniforms.textureB.value as THREE.Texture) = textTexture;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      const temp = rtA;
      rtA = rtB;
      rtB = temp;

      rafId = requestAnimationFrame(animate);
    };
    animate();

    // Trigger loaded state after a short delay for smooth animation
    setTimeout(() => setIsLoaded(true), 100);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseleave", onMouseLeave);

      mountTarget.removeChild(renderer.domElement);

      plane.dispose();
      simMaterial.dispose();
      renderMaterial.dispose();
      textTexture.dispose();
      rtA.dispose();
      rtB.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 1.5s ease-in-out'
      }}
    />
  );
}



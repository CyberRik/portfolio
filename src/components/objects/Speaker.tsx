"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SceneObject } from "@/lib/interactive/SceneObject";
import { materials, emissive } from "@/lib/materials";
import { Bx, Cyl } from "./primitives";
import { useAudioPlayer } from "@/lib/audioStore";

export function Speaker({ id = "speaker", position, rotationY = 0 }: { id?: string; position: [number, number, number]; rotationY?: number }) {
  const { playing } = useAudioPlayer();
  const wooferRef = useRef<THREE.Mesh>(null);
  const ledRef = useRef<THREE.Mesh>(null);
  
  // Custom materials for LED states
  const ledOn = useMemo(() => emissive("#fa5d6a", 2.5), []);
  const ledOff = useMemo(() => emissive("#221111", 0.1), []);

  useFrame((state) => {
    if (ledRef.current) {
      ledRef.current.material = playing ? ledOn : ledOff;
    }
    
    if (wooferRef.current) {
      if (playing) {
        // Simulate a thumping bass visually
        const scaleZ = 0.003 + Math.max(0, Math.sin(state.clock.elapsedTime * 14)) * 0.008;
        wooferRef.current.scale.set(0.17, scaleZ, 0.17);
      } else {
        // Reset scale smoothly or instantly
        wooferRef.current.scale.set(0.17, 0.003, 0.17);
      }
    }
  });

  return (
    <SceneObject
      def={{ id, name: "Studio Monitor" }}
      position={position}
      rotation={[0, rotationY, 0]}
    >
      {/* 4 Rubber feet */}
      <Bx position={[-0.1, 0.01, -0.1]} scale={[0.04, 0.02, 0.04]} material={materials.rubber} />
      <Bx position={[0.1, 0.01, -0.1]} scale={[0.04, 0.02, 0.04]} material={materials.rubber} />
      <Bx position={[-0.1, 0.01, 0.1]} scale={[0.04, 0.02, 0.04]} material={materials.rubber} />
      <Bx position={[0.1, 0.01, 0.1]} scale={[0.04, 0.02, 0.04]} material={materials.rubber} />

      {/* Main Cabinet (Oiled Walnut) */}
      <Bx position={[0, 0.35, 0]} scale={[0.26, 0.66, 0.3]} material={materials.deskTop} />
      
      {/* Front panel baffle (recessed slightly into the wood) */}
      <Bx position={[0, 0.35, 0.149]} scale={[0.24, 0.64, 0.002]} material={materials.deviceBody} />

      {/* Tweeter (Top) */}
      {/* Tweeter Ring */}
      <Cyl
        position={[0, 0.52, 0.151]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.07, 0.002, 0.07]}
        material={materials.metalMid}
      />
      {/* Tweeter Cone */}
      <Cyl
        position={[0, 0.52, 0.152]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.06, 0.003, 0.06]}
        material={materials.rubber}
      />
      {/* Tweeter Dome */}
      <Cyl
        position={[0, 0.52, 0.155]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.02, 0.004, 0.02]}
        material={materials.deviceBody}
      />

      {/* Woofer (Bottom) */}
      {/* Woofer Ring */}
      <Cyl
        position={[0, 0.25, 0.151]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.19, 0.002, 0.19]}
        material={materials.metalMid}
      />
      {/* Woofer Cone (Classic stark white studio monitor look) */}
      <Cyl
        ref={wooferRef}
        position={[0, 0.25, 0.152]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.17, 0.003, 0.17]}
        material={materials.whiteboard} 
      />
      {/* Woofer center dome */}
      <Cyl
        position={[0, 0.25, 0.156]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.06, 0.004, 0.06]}
        material={materials.rubber}
      />

      {/* Bass reflex port (hole) */}
      <Cyl
        position={[0.07, 0.09, 0.151]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.03, 0.003, 0.03]}
        material={materials.rubber} 
      />

      {/* Brand / Logo plate */}
      <Bx position={[0, 0.09, 0.151]} scale={[0.04, 0.015, 0.002]} material={materials.metalMid} />

      {/* Status LED */}
      <Cyl
        ref={ledRef}
        position={[0.09, 0.62, 0.151]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.005, 0.005, 0.005]}
        material={ledOff}
      />
    </SceneObject>
  );
}

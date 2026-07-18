"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useThree, type ThreeElements, type ThreeEvent } from "@react-three/fiber";
import { Select } from "@react-three/postprocessing";
import { interactiveRegistry } from "./registry";
import type { InteractiveObjectDef } from "./types";
import { setHoveredItem, clearHoveredItem } from "@/lib/interaction";
import { flyToPose, flyToView } from "@/components/camera/cameraBus";

type SceneObjectProps = ThreeElements["group"] & {
  def: InteractiveObjectDef;
  children: ReactNode;
};

/** Ignore "clicks" that were actually orbit drags. */
const CLICK_SLOP_PX = 6;

/**
 * Game-style interactive wrapper. Every object mounts inside one:
 *  - hover: outline highlight (Selection/Outline pass) + name tag via
 *    the interaction store + pointer cursor
 *  - click: camera flies to the object — its named view if it has one,
 *    otherwise a pose computed from the object's bounding sphere
 */
export function SceneObject({ def, children, ...groupProps }: SceneObjectProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const camera = useThree((s) => s.camera);

  useEffect(() => interactiveRegistry.register(def), [def]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
  }, [hovered]);

  useEffect(
    () => () => {
      clearHoveredItem(def.id);
      document.body.style.cursor = "auto";
    },
    [def.id],
  );

  const focus = () => {
    if (def.cameraView) {
      flyToView(def.cameraView);
      return;
    }
    if (def.cameraTarget) {
      flyToPose(def.cameraTarget.position, def.cameraTarget.target);
      return;
    }
    const g = group.current;
    if (!g) return;
    const box = new THREE.Box3().setFromObject(g);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const c = sphere.center;
    const dist = THREE.MathUtils.clamp(sphere.radius * 2.8, 0.9, 4.2);
    const dir = camera.position.clone().sub(c).normalize();
    const pos = c.clone().addScaledVector(dir, dist);
    pos.y = Math.max(pos.y, c.y + dist * 0.12, 0.5);
    flyToPose([pos.x, pos.y, pos.z], [c.x, c.y, c.z], 1.5);
  };

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    setHoveredItem({ id: def.id, name: def.name });
  };
  const onOut = () => {
    setHovered(false);
    clearHoveredItem(def.id);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > CLICK_SLOP_PX) return;
    focus();
  };

  return (
    <Select enabled={hovered}>
      <group
        ref={group}
        name={`interactive:${def.id}`}
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
        {...groupProps}
      >
        {children}
      </group>
    </Select>
  );
}

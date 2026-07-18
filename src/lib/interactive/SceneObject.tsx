"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useThree, type ThreeElements, type ThreeEvent } from "@react-three/fiber";
import { interactiveRegistry } from "./registry";
import type { InteractiveObjectDef } from "./types";
import { setHoveredItem, clearHoveredItem } from "@/lib/interaction";
import { selectObject, deselectObject } from "./selection";
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
      if (group.current) deselectObject(group.current);
      document.body.style.cursor = "auto";
    },
    [def.id],
  );

  const focus = () => {
    if (def.cameraView) {
      flyToView(def.cameraView, undefined, { id: def.id, name: def.name });
      return;
    }
    if (def.cameraTarget) {
      flyToPose(def.cameraTarget.position, def.cameraTarget.target, undefined, {
        id: def.id,
        name: def.name,
      });
      return;
    }
    const g = group.current;
    if (!g) return;
    const box = new THREE.Box3().setFromObject(g);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const c = sphere.center;
    const dist = THREE.MathUtils.clamp(sphere.radius * 2.8, 0.9, 4.2);

    // Composed approach: blend the object's outward direction (away
    // from the nearest wall, toward room center) with the room's open
    // front, then bias a few degrees toward the camera's current side
    // so the flight feels continuous — never a straight-on mugshot.
    const outward = new THREE.Vector3(-c.x, 0, -c.z);
    if (outward.lengthSq() < 0.05) outward.set(0, 0, 1);
    outward.normalize();
    const dir = outward.multiplyScalar(0.65).add(new THREE.Vector3(0, 0, 0.55));
    dir.x += Math.sign(camera.position.x - c.x || 1) * 0.28;
    dir.normalize();

    const pos = c.clone().addScaledVector(dir, dist);
    // gentle high angle, clamped inside the diorama envelope — must
    // match the CameraRig's per-frame planes (x ±3.4, z ≥ −2.5) or
    // the envelope would nudge the pose the moment the flight lands
    pos.y = THREE.MathUtils.clamp(Math.max(c.y + dist * 0.22, 0.6), 0.5, 2.7);
    pos.x = THREE.MathUtils.clamp(pos.x, -3.3, 3.3);
    pos.z = THREE.MathUtils.clamp(pos.z, -2.4, 6.5);

    flyToPose([pos.x, pos.y, pos.z], [c.x, c.y, c.z], 2.0, { id: def.id, name: def.name });
  };

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    setHoveredItem({ id: def.id, name: def.name });
    if (group.current) selectObject(group.current);
  };
  const onOut = () => {
    setHovered(false);
    clearHoveredItem(def.id);
    if (group.current) deselectObject(group.current);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > CLICK_SLOP_PX) return;
    focus();
  };

  return (
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
  );
}

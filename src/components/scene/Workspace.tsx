"use client";

import { Room } from "./Room";
import { Desk } from "@/components/objects/Desk";
import { Monitor } from "@/components/objects/Monitor";
import { Laptop } from "@/components/objects/Laptop";
import { Keyboard } from "@/components/objects/Keyboard";
import { Mouse } from "@/components/objects/Mouse";
import { CoffeeMug } from "@/components/objects/CoffeeMug";
import { Whiteboard } from "@/components/objects/Whiteboard";
import { Bookshelf } from "@/components/objects/Bookshelf";
import { ServerRack } from "@/components/objects/ServerRack";
import { Plant } from "@/components/objects/Plant";
import { CityWindow } from "@/components/objects/CityWindow";
import { FloorLamp } from "@/components/objects/FloorLamp";
import { WallFrames } from "@/components/objects/WallFrames";
import { WallShelf } from "@/components/objects/WallShelf";
import { DeskChair } from "@/components/objects/DeskChair";
import { DeskLamp } from "@/components/objects/DeskLamp";
import { ReadingCorner } from "@/components/objects/ReadingCorner";
import { DustParticles } from "@/components/effects/DustParticles";
import { SunShaft } from "@/components/effects/SunShaft";

/**
 * The full room. Pure composition — every object owns its transform
 * relative to the room and registers itself with the interactive registry.
 */
export function Workspace() {
  return (
    <group name="workspace">
      <Room />

      {/* Desk zone */}
      <Desk />
      <Monitor />
      <Laptop />
      <Keyboard />
      <Mouse />
      <CoffeeMug />
      <DeskChair />
      <DeskLamp />

      {/* Perimeter */}
      <CityWindow />
      <Whiteboard />
      <Bookshelf />
      <ServerRack />
      <FloorLamp />
      <WallFrames />
      <WallShelf />

      <ReadingCorner />

      {/* potted_plant_04 is tabletop-scale in real life — scaled up for
          the floor corner, small variant dressed on the coffee table */}
      <Plant id="plant-corner" position={[-3.3, 0, -2.5]} variant="large" scale={2.6} rotationY={0.6} />
      <Plant id="plant-entry" position={[3.35, 0, 1.95]} variant="small" scale={1.5} rotationY={-1.2} />
      <Plant id="plant-table" position={[-1.95, 0.31, 1.55]} variant="large" scale={0.9} rotationY={2.1} />

      {/* Atmosphere */}
      <DustParticles />
      <SunShaft />
    </group>
  );
}

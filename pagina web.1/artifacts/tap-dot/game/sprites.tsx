import React from "react";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
} from "react-native-svg";

export function SoldierSprite({
  size,
  color,
  helmet,
  walkPhase = 0,
}: {
  size: number;
  color: string;
  helmet: string;
  walkPhase?: number;
}) {
  const swing = Math.sin(walkPhase * Math.PI * 2) * 1.6;
  const armSwing = Math.sin(walkPhase * Math.PI * 2) * 1.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* shadow */}
      <Circle cx="12" cy="22" r="6" fill="#000" opacity={0.28} />
      {/* legs (swinging) */}
      <Rect
        x={9 + swing}
        y="16.5"
        width="2.6"
        height="4"
        fill="#1a1f1a"
        rx={0.4}
      />
      <Rect
        x={12.4 - swing}
        y="16.5"
        width="2.6"
        height="4"
        fill="#1a1f1a"
        rx={0.4}
      />
      {/* boots */}
      <Rect
        x={8.7 + swing}
        y="20"
        width="3.2"
        height="1.4"
        fill="#0a0a0a"
        rx={0.4}
      />
      <Rect
        x={12.1 - swing}
        y="20"
        width="3.2"
        height="1.4"
        fill="#0a0a0a"
        rx={0.4}
      />
      {/* body */}
      <Rect
        x="7.5"
        y="9.5"
        width="9"
        height="8"
        rx="1.6"
        fill={color}
        stroke="#0a0d0a"
        strokeWidth={0.6}
      />
      {/* vest */}
      <Rect
        x="9"
        y="11"
        width="6"
        height="5"
        fill="#1a1f1a"
        opacity={0.7}
      />
      <Path
        d="M9.2 11 L14.8 16 M14.8 11 L9.2 16"
        stroke="#0a0d0a"
        strokeWidth={0.4}
      />
      {/* arms */}
      <Rect
        x={5.5}
        y={10 + armSwing}
        width="2.2"
        height="5.5"
        fill={color}
        stroke="#0a0d0a"
        strokeWidth={0.4}
        rx={0.6}
      />
      <Rect
        x={16.3}
        y={10 - armSwing}
        width="2.2"
        height="5.5"
        fill={color}
        stroke="#0a0d0a"
        strokeWidth={0.4}
        rx={0.6}
      />
      {/* gloves */}
      <Circle cx={6.6} cy={15.6 + armSwing} r="1.2" fill="#0a0a0a" />
      <Circle cx={17.4} cy={15.6 - armSwing} r="1.2" fill="#0a0a0a" />
      {/* head */}
      <Circle cx="12" cy="7.2" r="3.2" fill="#d4a87a" />
      {/* helmet */}
      <Path
        d="M8.5 7.2 A3.5 3.5 0 0 1 15.5 7.2 L15.5 8.4 L8.5 8.4 Z"
        fill={helmet}
        stroke="#0a0d0a"
        strokeWidth={0.5}
      />
      <Rect x="8.5" y="8" width="7" height="0.7" fill="#0a0d0a" />
      {/* helmet stripe */}
      <Rect x="11.5" y="4.6" width="1" height="3.6" fill="#0a0d0a" opacity={0.5} />
      {/* eyes */}
      <Circle cx="10.7" cy="7.8" r="0.35" fill="#0a0a0a" />
      <Circle cx="13.3" cy="7.8" r="0.35" fill="#0a0a0a" />
    </Svg>
  );
}

export function ZombieSprite({
  size,
  walkPhase = 0,
  variant = "normal",
}: {
  size: number;
  walkPhase?: number;
  variant?: "normal" | "runner" | "tank";
}) {
  const swing = Math.sin(walkPhase * Math.PI * 2) * 1.4;
  const armBob = Math.sin(walkPhase * Math.PI * 2) * 1.6;
  const skin = variant === "tank" ? "#3d5a28" : variant === "runner" ? "#7caa55" : "#5a8540";
  const dark = variant === "tank" ? "#1a2a0a" : "#1a3a0a";
  const shirt = variant === "tank" ? "#2a4520" : variant === "runner" ? "#4a7028" : "#3d6b2e";
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="22" r="6" fill="#000" opacity={0.32} />
      {/* legs */}
      <Rect
        x={9 + swing}
        y="17"
        width="2.4"
        height="3.6"
        fill="#3a2a1a"
        rx={0.3}
      />
      <Rect
        x={12.6 - swing}
        y="17"
        width="2.4"
        height="3.6"
        fill="#3a2a1a"
        rx={0.3}
      />
      {/* feet */}
      <Rect x={8.6 + swing} y="20" width="3.2" height="1.2" fill="#1a0a0a" />
      <Rect x={12.2 - swing} y="20" width="3.2" height="1.2" fill="#1a0a0a" />
      {/* outstretched arms (swinging) */}
      <Rect
        x="2"
        y={11 + armBob}
        width="6"
        height="2.4"
        fill={skin}
        stroke={dark}
        strokeWidth={0.4}
        rx={0.6}
      />
      <Rect
        x="16"
        y={11 - armBob}
        width="6"
        height="2.4"
        fill={skin}
        stroke={dark}
        strokeWidth={0.4}
        rx={0.6}
      />
      {/* hands with claws */}
      <Circle cx="2.2" cy={12.2 + armBob} r="1.3" fill="#6b9a4a" />
      <Circle cx="21.8" cy={12.2 - armBob} r="1.3" fill="#6b9a4a" />
      <Path
        d={`M0.5 ${10.8 + armBob} L1.4 ${12 + armBob} M0.5 ${13.6 + armBob} L1.4 ${12.4 + armBob}`}
        stroke="#1a0a0a"
        strokeWidth={0.4}
      />
      <Path
        d={`M23.5 ${10.8 - armBob} L22.6 ${12 - armBob} M23.5 ${13.6 - armBob} L22.6 ${12.4 - armBob}`}
        stroke="#1a0a0a"
        strokeWidth={0.4}
      />
      {/* tattered shirt */}
      <Path
        d="M7 11 L17 11 L17 18.5 L15.5 17.5 L13.5 18.8 L11 17 L9.2 18.8 L7 17.5 Z"
        fill={shirt}
        stroke={dark}
        strokeWidth={0.5}
      />
      {/* blood stains on shirt */}
      <Circle cx="11" cy="14" r="0.8" fill="#5a0a0a" opacity={0.7} />
      <Circle cx="14" cy="13" r="0.5" fill="#5a0a0a" opacity={0.7} />
      {/* head */}
      <Circle
        cx="12"
        cy="7"
        r="3.5"
        fill={skin}
        stroke={dark}
        strokeWidth={0.5}
      />
      {/* hair tufts */}
      <Path d="M9 5 L9.5 4 L10.2 4.8 M14 5 L14.5 4 L15.2 4.8" stroke={dark} strokeWidth={0.6} fill="none" />
      {/* bandage */}
      <Rect x="8.5" y="6" width="7" height="0.8" fill="#d4cfa7" opacity={0.85} />
      <Path d="M9 6.4 L11 6.4 M13 6.4 L15 6.4" stroke="#5a0a0a" strokeWidth={0.3} />
      {/* eyes (glowing red) */}
      <Circle cx="10.5" cy="7.4" r="0.95" fill="#ff3030" />
      <Circle cx="13.5" cy="7.4" r="0.95" fill="#ff3030" />
      <Circle cx="10.5" cy="7.4" r="0.4" fill="#fff7b0" />
      <Circle cx="13.5" cy="7.4" r="0.4" fill="#fff7b0" />
      {/* mouth/teeth */}
      <Path
        d="M9.5 8.7 L14.5 8.7 L14 9.7 L13 9 L12 9.7 L11 9 L10 9.7 Z"
        fill="#1a0a0a"
      />
      {/* blood drip */}
      <Path d="M11 9.7 L11 11" stroke="#aa0000" strokeWidth={0.5} />
      <Circle cx="11" cy="11.2" r="0.4" fill="#aa0000" />
    </Svg>
  );
}

export function BossSprite({
  size,
  walkPhase = 0,
}: {
  size: number;
  walkPhase?: number;
}) {
  const swing = Math.sin(walkPhase * Math.PI * 2) * 1.8;
  const armBob = Math.sin(walkPhase * Math.PI * 2) * 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="29" r="10" fill="#000" opacity={0.45} />
      {/* arms with claws */}
      <Rect
        x="1"
        y={14 + armBob}
        width="9"
        height="3.4"
        fill="#7a1a1a"
        stroke="#1a0a0a"
        strokeWidth={0.5}
        rx={0.8}
      />
      <Rect
        x="22"
        y={14 - armBob}
        width="9"
        height="3.4"
        fill="#7a1a1a"
        stroke="#1a0a0a"
        strokeWidth={0.5}
        rx={0.8}
      />
      <Circle cx="1.5" cy={15.7 + armBob} r="2" fill="#5a1010" />
      <Circle cx="30.5" cy={15.7 - armBob} r="2" fill="#5a1010" />
      <Path
        d={`M0 ${13.5 + armBob} L1.2 ${15.5 + armBob} M0 ${17.5 + armBob} L1.2 ${15.8 + armBob} M-0.5 ${15.5 + armBob} L1.2 ${15.6 + armBob}`}
        stroke="#0a0a0a"
        strokeWidth={0.6}
      />
      <Path
        d={`M32 ${13.5 - armBob} L30.8 ${15.5 - armBob} M32 ${17.5 - armBob} L30.8 ${15.8 - armBob} M32.5 ${15.5 - armBob} L30.8 ${15.6 - armBob}`}
        stroke="#0a0a0a"
        strokeWidth={0.6}
      />
      {/* legs */}
      <Rect
        x={11 + swing}
        y="24"
        width="3.4"
        height="5"
        fill="#1a0a0a"
        rx={0.5}
      />
      <Rect
        x={17.6 - swing}
        y="24"
        width="3.4"
        height="5"
        fill="#1a0a0a"
        rx={0.5}
      />
      {/* body */}
      <Rect
        x="8.5"
        y="13"
        width="15"
        height="12"
        rx="2.5"
        fill="#7a1a1a"
        stroke="#1a0a0a"
        strokeWidth={0.8}
      />
      {/* spikes on shoulders */}
      <Path
        d="M8.5 13 L6.5 8 L11 12 Z M23.5 13 L25.5 8 L21 12 Z"
        fill="#0a0a0a"
      />
      {/* chest scar */}
      <Path
        d="M13 16 L19 22 M19 16 L13 22"
        stroke="#3a0a0a"
        strokeWidth={1}
      />
      {/* head */}
      <Circle
        cx="16"
        cy="9"
        r="6"
        fill="#7a1a1a"
        stroke="#1a0a0a"
        strokeWidth={0.8}
      />
      {/* horns */}
      <Path
        d="M11 7 L8 2 L13 5 Z M21 7 L24 2 L19 5 Z"
        fill="#0a0a0a"
        stroke="#3a0a0a"
        strokeWidth={0.4}
      />
      {/* glowing eyes */}
      <Circle cx="13.5" cy="9" r="1.5" fill="#ffd84d" />
      <Circle cx="18.5" cy="9" r="1.5" fill="#ffd84d" />
      <Circle cx="13.5" cy="9" r="0.7" fill="#ff3030" />
      <Circle cx="18.5" cy="9" r="0.7" fill="#ff3030" />
      {/* fanged mouth */}
      <Path
        d="M11 11.5 L21 11.5 L20.2 14 L18.8 12.5 L17.3 14 L15 12.5 L13.5 14 L12 12.5 Z"
        fill="#1a0a0a"
      />
      <Path
        d="M13 14 L13 15.5 M16 13 L16 15.5 M19 14 L19 15.5"
        stroke="#fff7b0"
        strokeWidth={0.5}
      />
      {/* drool */}
      <Path d="M16 15.5 L16 17.5" stroke="#aaff80" strokeWidth={0.4} opacity={0.7} />
    </Svg>
  );
}

export function StoneWallSprite({
  size,
  hpRatio = 1,
}: {
  size: number;
  hpRatio?: number;
}) {
  const dmg = 1 - hpRatio;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="0" y="0" width="24" height="24" fill="#3a3f4a" />
      {/* mortar lines */}
      <Path
        d="M0 8 L24 8 M0 16 L24 16 M8 0 L8 8 M14 8 L14 16 M5 16 L5 24 M18 16 L18 24"
        stroke="#262a32"
        strokeWidth={1}
      />
      {/* stone texture spots */}
      <Circle cx="4" cy="4" r="0.6" fill="#262a32" />
      <Circle cx="18" cy="4" r="0.6" fill="#262a32" />
      <Circle cx="11" cy="12" r="0.6" fill="#262a32" />
      <Circle cx="21" cy="20" r="0.6" fill="#262a32" />
      {/* highlights */}
      <Line x1="0" y1="0" x2="24" y2="0" stroke="#4a505c" strokeWidth={1} />
      <Line x1="0" y1="0" x2="0" y2="24" stroke="#4a505c" strokeWidth={1} />
      {/* damage cracks (progressive) */}
      {dmg > 0.25 && (
        <Path
          d="M2 2 L8 10 L6 16"
          stroke="#0a0a0a"
          strokeWidth={0.8}
          opacity={Math.min(1, dmg * 1.4)}
          fill="none"
        />
      )}
      {dmg > 0.5 && (
        <Path
          d="M14 4 L18 12 L22 14 M16 16 L20 22"
          stroke="#0a0a0a"
          strokeWidth={1}
          opacity={Math.min(1, dmg * 1.4)}
          fill="none"
        />
      )}
      {dmg > 0.75 && (
        <>
          <Circle cx="12" cy="12" r="3" fill="#0a0a0a" opacity={dmg * 0.5} />
          <Path
            d="M12 9 L13 14 L9 12 M15 18 L11 20"
            stroke="#1a0a0a"
            strokeWidth={1.2}
            fill="none"
          />
        </>
      )}
    </Svg>
  );
}

export function BarricadeSprite({
  size,
  hpRatio,
}: {
  size: number;
  hpRatio: number;
}) {
  const damage = 1 - hpRatio;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="0" y="0" width="24" height="24" fill="#6b4a2a" />
      <Path
        d="M0 6 L24 6 M0 12 L24 12 M0 18 L24 18"
        stroke="#3a2a1a"
        strokeWidth={1}
      />
      <Path
        d="M4 0 L4 24 M12 0 L12 24 M20 0 L20 24"
        stroke="#3a2a1a"
        strokeWidth={0.5}
      />
      {/* nails */}
      <Circle cx="4" cy="3" r="0.5" fill="#1a1a1a" />
      <Circle cx="20" cy="3" r="0.5" fill="#1a1a1a" />
      <Circle cx="4" cy="21" r="0.5" fill="#1a1a1a" />
      <Circle cx="20" cy="21" r="0.5" fill="#1a1a1a" />
      {damage > 0.3 && (
        <Path
          d="M2 4 L8 12 L4 18"
          stroke="#1a0a0a"
          strokeWidth={1}
          opacity={Math.min(1, damage * 1.5)}
          fill="none"
        />
      )}
      {damage > 0.6 && (
        <Path
          d="M14 2 L18 10 L22 14 M10 16 L14 22"
          stroke="#1a0a0a"
          strokeWidth={1.2}
          opacity={Math.min(1, damage * 1.4)}
          fill="none"
        />
      )}
    </Svg>
  );
}

export function TurretSprite({
  size,
  angle,
  level = 1,
}: {
  size: number;
  angle: number;
  level?: number;
}) {
  const barrelLen = 10 + Math.min(4, level - 1);
  const accent = level >= 5 ? "#ffd84d" : level >= 3 ? "#7cff5c" : "#a3d977";
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="0" y="0" width="24" height="24" fill="#2a3a1a" rx="2" />
      <Rect
        x="2"
        y="2"
        width="20"
        height="20"
        fill="none"
        stroke="#1a2a0a"
        strokeWidth={1}
        rx="2"
      />
      <G origin="12, 12" rotation={(angle * 180) / Math.PI}>
        <Circle
          cx="12"
          cy="12"
          r="6"
          fill={accent}
          stroke="#0a0d0a"
          strokeWidth={1}
        />
        <Rect x="12" y="11" width={barrelLen} height="2" fill="#0a0d0a" />
        <Rect x={11 + barrelLen} y="10.5" width="1.5" height="3" fill="#3a3a3a" />
        <Circle cx="12" cy="12" r="2" fill="#0a0d0a" />
      </G>
    </Svg>
  );
}

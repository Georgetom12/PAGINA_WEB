import React, { useCallback, useRef, useState } from "react";
import { GestureResponderEvent, View } from "react-native";

interface Props {
  size?: number;
  baseColor?: string;
  thumbColor?: string;
  borderColor?: string;
  onChange: (dx: number, dy: number) => void;
}

export function Joystick({
  size = 130,
  baseColor = "rgba(40,50,40,0.55)",
  thumbColor = "#7cff5c",
  borderColor = "rgba(124,255,92,0.4)",
  onChange,
}: Props) {
  const radius = size / 2;
  const thumbR = size * 0.28;
  const maxOff = radius - thumbR - 4;
  const [thumb, setThumb] = useState({ x: 0, y: 0 });
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const update = useCallback(
    (lx: number, ly: number) => {
      const dx = lx - radius;
      const dy = ly - radius;
      const d = Math.hypot(dx, dy);
      if (d <= maxOff) {
        setThumb({ x: dx, y: dy });
        cbRef.current(dx / maxOff, dy / maxOff);
      } else {
        const nx = (dx / d) * maxOff;
        const ny = (dy / d) * maxOff;
        setThumb({ x: nx, y: ny });
        cbRef.current(nx / maxOff, ny / maxOff);
      }
    },
    [maxOff, radius],
  );

  const release = useCallback(() => {
    setThumb({ x: 0, y: 0 });
    cbRef.current(0, 0);
  }, []);

  const onGrant = (e: GestureResponderEvent) => {
    update(e.nativeEvent.locationX, e.nativeEvent.locationY);
  };
  const onMove = (e: GestureResponderEvent) => {
    update(e.nativeEvent.locationX, e.nativeEvent.locationY);
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: baseColor,
        borderWidth: 2,
        borderColor,
        alignItems: "center",
        justifyContent: "center",
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={release}
      onResponderTerminate={release}
    >
      <View
        style={{
          position: "absolute",
          width: thumbR * 2,
          height: thumbR * 2,
          borderRadius: thumbR,
          backgroundColor: thumbColor,
          left: radius - thumbR + thumb.x,
          top: radius - thumbR + thumb.y,
          shadowColor: thumbColor,
          shadowOpacity: 0.6,
          shadowRadius: 8,
        }}
      />
    </View>
  );
}

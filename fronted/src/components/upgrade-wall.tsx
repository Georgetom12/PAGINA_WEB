import React from "react";
import { Link } from "wouter";
import { PLAN_COLORS, PLAN_PRICES, PLAN_NAMES, type PlanLevel } from "@/lib/auth";

interface UpgradeWallProps {
  required: PlanLevel;
  current?: string;
  isAdminRequired?: boolean;
}

export default function UpgradeWall({ required, current, isAdminRequired }: UpgradeWallProps) {
  const color  = PLAN_COLORS[required]  ?? "#00e5ff";
  const price  = PLAN_PRICES[required]  ?? "";
  const name   = PLAN_NAMES[required]   ?? required.toUpperCase();
  const curName = current ? (PLAN_NAMES[current] ?? current.toUpperCase()) : null;

  return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 rounded-full border-2 mx-auto mb-6 flex items-center justify-center"
            style={{ borderColor: `${color}44`, background: `${color}08` }}>
            <span className="text-5xl">🔒</span>
          </div>

          <div className="font-space text-[9px] tracking-[0.4em] uppercase mb-3" style={{ color }}>
            ACCESO RESTRINGIDO
          </div>

          <div className="font-bebas text-5xl text-white mb-3 leading-none">
            {isAdminRequired ? (
              <>SOLO <span style={{ color }}>ADMINISTRADORES</span></>
            ) : (
              <>PLAN <span style={{ color }}>{name}</span> REQUERIDO</>
            )}
          </div>

          {curName && (
            <div className="font-space text-[11px] text-[#7ab3c8] mb-1">
              Tu plan actual: <span className="text-white font-bold">{curName}</span>
            </div>
          )}

          <div className="font-space text-[11px] text-[#7ab3c8] mt-4 leading-relaxed border border-[#1a2535] bg-[#060a0f] p-4">
            {isAdminRequired
              ? "Esta sección es exclusiva para administradores de la plataforma."
              : <>Este módulo requiere el plan <strong style={{ color }}>{name} ({price})</strong> o superior para acceder.</>
            }
          </div>
        </div>

        {!isAdminRequired && (
          <div className="flex flex-col gap-3 mb-6">
            <Link href="/pricing"
              className="font-space text-[11px] tracking-[0.15em] uppercase px-6 py-3 no-underline font-bold transition-opacity hover:opacity-80 block"
              style={{ background: color, color: "#020408" }}>
              ⬆ MEJORAR A {name} — {price}
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/dashboard"
            className="font-space text-[11px] tracking-[0.1em] uppercase px-6 py-3 border border-[#1a2535] text-[#7ab3c8] no-underline hover:text-white hover:border-[#243040] transition-colors block">
            ← VOLVER AL DASHBOARD
          </Link>
        </div>

        <div className="mt-6 font-space text-[9px] text-[#5a8898] tracking-[0.05em]">
          ¿Tenés una cuenta con el plan correcto?{" "}
          <Link href="/login" className="text-[#7ab3c8] hover:text-[#00e5ff] no-underline">
            Iniciá sesión →
          </Link>
        </div>
      </div>
    </div>
  );
}

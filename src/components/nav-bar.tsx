"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";

interface NavBarProps {
  session: Session | null;
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function NavBar({ session, title, left, right }: NavBarProps) {
  return (
    <nav
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 gap-4 bg-popover border-b border-border"
    >
      <div className="flex items-center gap-3">
        {left}
        {title && (
          <span className="text-sm font-semibold text-foreground hidden sm:block">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {right}
        {session?.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? ""}
            width={28}
            height={28}
            className="rounded-full"
            unoptimized
          />
        )}
        <span className="text-xs text-muted-foreground hidden sm:block">
          {session?.user?.name}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </Button>
      </div>
    </nav>
  );
}

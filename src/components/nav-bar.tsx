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
  rightmost?: React.ReactNode;
}

export function NavBar({ session, title, left, right, rightmost }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-20 bg-popover border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {left}
          {title && (
            <span className="text-base font-semibold text-foreground hidden md:block">
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
          <span className="text-sm font-bold text-foreground hidden md:block">
            {session?.user?.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </Button>
          {rightmost}
        </div>
      </div>
    </nav>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCw } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";

export function BackButton() {
  const router = useRouter();
  return (
    <Button
      icon={ArrowLeft}
      onClick={() =>
        window.history.length > 1 ? router.back() : router.push("/")
      }
    >
      Kembali
    </Button>
  );
}

type RetryButtonProps = {
  label?: string;
  onRetry?: () => void;
  variant?: "primary" | "secondary";
};

export function RetryButton({
  label = "Coba lagi",
  onRetry,
  variant = "primary",
}: RetryButtonProps) {
  return (
    <Button
      variant={variant}
      icon={RotateCw}
      onClick={() => (onRetry ? onRetry() : window.location.reload())}
    >
      {label}
    </Button>
  );
}

import { cx } from "@/lib/cx";

type BrandMarkProps = {
  animated?: boolean;
};

type BrandLogoProps = BrandMarkProps & {
  size?: "md" | "lg";
};

export function BrandMark({ animated = false }: BrandMarkProps) {
  return (
    <svg className={cx("brand-mark", animated && "animate")} viewBox="0 0 40 40" aria-hidden="true">
      <rect className="bm-bg" width="40" height="40" rx="10" fill="#3E6AE1" />
      <rect
        className="bm-cal"
        x="10"
        y="12"
        width="20"
        height="18"
        rx="3.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.4"
      />
      <path
        className="bm-top"
        d="M10 17.5h20M15 9.5v4.5M25 9.5v4.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className="bm-check"
        d="M15.6 23.6l2.9 2.9 5.9-5.9"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({ size = "md", animated = false }: BrandLogoProps) {
  return (
    <span className={size === "lg" ? "brand brand-lg" : "brand"}>
      <BrandMark animated={animated} />
      <span className="brand-word">
        <b>Meeting Room</b>
        <small>Booking</small>
      </span>
    </span>
  );
}

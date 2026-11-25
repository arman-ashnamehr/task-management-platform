import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-xl boarder boarder-slate-800 bg-slate-900",
        className,
      ].join(" ")}
      {...props}
    ></div>
  );
}

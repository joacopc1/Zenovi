import Image from "next/image";

type BrandMarkProps = {
  size?: "sm" | "md";
};

const sizes = {
  sm: { container: "size-8", image: 15 },
  md: { container: "size-9", image: 18 },
} as const;

export function BrandMark({ size = "sm" }: BrandMarkProps) {
  const dimensions = sizes[size];

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-black ${dimensions.container}`}
      aria-hidden="true"
    >
      <Image
        src="/brand/zenovi-mark.png"
        width={dimensions.image}
        height={dimensions.image}
        alt=""
        className="block -translate-y-[0.5px]"
      />
    </span>
  );
}

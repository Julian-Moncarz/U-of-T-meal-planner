type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface DecorativeCornerProps {
  position: Position;
  variant?: "default" | "onboarding";
}

export function DecorativeCorner({ position, variant = "default" }: DecorativeCornerProps) {
  if (variant === "onboarding") {
    const rotations = {
      "top-left": "",
      "top-right": "rotate-90",
      "bottom-right": "rotate-180",
      "bottom-left": "-rotate-90",
    };

    return (
      <svg
        className={`absolute w-8 h-8 ${rotations[position]} ${
          position.includes("top") ? "-top-[1px]" : "-bottom-[1px]"
        } ${position.includes("left") ? "-left-[1px]" : "-right-[1px]"}`}
        viewBox="0 0 32 32"
        fill="none"
        stroke="#1E3765"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M0 32 L0 0 L32 0" />
        <path d="M0 12 Q6 6 12 0" />
      </svg>
    );
  }

  const rotations = {
    "top-left": "rotate-90",
    "top-right": "rotate-180",
    "bottom-right": "-rotate-90",
    "bottom-left": "",
  };

  return (
    <svg
      className={`absolute w-12 h-12 ${rotations[position]} ${
        position.includes("top") ? "top-1" : "bottom-1"
      } ${position.includes("left") ? "left-1" : "right-1"} z-10`}
      viewBox="2.7 2.7 97.3 97.3"
      fill="#1A1A1A"
    >
      <polygon points="20.4953384,81.6360779 35.0803528,81.6360779 35.0803528,79.5044022 20.4953384,79.5044022 20.4953384,64.9199066 18.3636627,64.9199066 18.3636627,79.5044022 4.8444881,79.5044022 4.8444881,64.9199066 2.7128124,64.9199066 2.7128124,81.6360779 18.3636627,81.6360779 18.3636627,97.2874451 35.0803528,97.2874451 35.0803528,95.1557693 20.4953384,95.1557693" />
      <polygon points="16.0943336,68.2546844 12.6696529,68.2546844 12.6696529,2.7125521 10.5379772,2.7125521 10.5379772,68.2546844 7.1135569,68.2546844 7.1135569,77.235466 16.0943336,77.235466" />
      <polygon points="31.7451191,87.329567 31.7451191,83.9054718 22.7643433,83.9054718 22.7643433,92.8862457 31.7451191,92.8862457 31.7451191,89.4612427 97.2871857,89.4612427 97.2871857,87.329567" />
    </svg>
  );
}

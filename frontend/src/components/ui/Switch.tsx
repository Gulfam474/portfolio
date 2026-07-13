import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "relative h-5 w-9 rounded-full border border-border-subtle bg-background transition data-[state=checked]:bg-accent-indigo disabled:opacity-50"
      )}
    >
      <SwitchPrimitive.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  );
}

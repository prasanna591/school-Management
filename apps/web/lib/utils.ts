import { cn } from "@/lib/utils"

export function utils(...classes: (string | undefined | null | false)[]) {
  return cn(...classes)
}

import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

/**
 * Merges Tailwind classes using clsx and tailwind-merge.
 * This ensures conditional classes are handled correctly and 
 * overlapping tailwind classes are merged properly.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

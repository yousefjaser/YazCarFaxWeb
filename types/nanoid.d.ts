// تعريف لـ nanoid لحل مشكلة التوافق
declare module 'nanoid' {
  export function nanoid(size?: number): string;
  export default function nanoid(size?: number): string;
}

declare module 'nanoid/non-secure' {
  export function nanoid(size?: number): string;
  export default function nanoid(size?: number): string;
} 
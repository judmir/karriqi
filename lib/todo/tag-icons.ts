import {
  Baby,
  Briefcase,
  Car,
  Dumbbell,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Landmark,
  Leaf,
  MapPin,
  PawPrint,
  Plane,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Tag,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Default icon when none is chosen yet. */
export const DEFAULT_TODO_TAG_ICON = "tag";

/** Brand colour for tag icons on cards and inputs. */
export const TODO_TAG_ICON_COLOR = "#F66500";

export type TodoTagIconOption = {
  /** Stored in `todo_tags.icon` — kebab-case lucide export name. */
  key: string;
  label: string;
  /** Extra search terms for the icon picker filter. */
  keywords: string[];
  Icon: LucideIcon;
};

export const TODO_TAG_ICON_OPTIONS: readonly TodoTagIconOption[] = [
  { key: "tag", label: "Tag", keywords: ["label", "generic"], Icon: Tag },
  { key: "home", label: "Home", keywords: ["house", "domestic"], Icon: Home },
  {
    key: "heart-pulse",
    label: "Health",
    keywords: ["medical", "doctor", "wellness"],
    Icon: HeartPulse,
  },
  {
    key: "stethoscope",
    label: "Medical",
    keywords: ["doctor", "clinic", "health"],
    Icon: Stethoscope,
  },
  { key: "heart", label: "Heart", keywords: ["love", "care"], Icon: Heart },
  {
    key: "shopping-cart",
    label: "Shopping",
    keywords: ["groceries", "store", "buy"],
    Icon: ShoppingCart,
  },
  {
    key: "plane",
    label: "Travel",
    keywords: ["trip", "flight", "vacation"],
    Icon: Plane,
  },
  {
    key: "map-pin",
    label: "Location",
    keywords: ["place", "map", "address"],
    Icon: MapPin,
  },
  {
    key: "wallet",
    label: "Finances",
    keywords: ["money", "budget", "pay"],
    Icon: Wallet,
  },
  {
    key: "landmark",
    label: "Bank",
    keywords: ["finance", "tax", "money"],
    Icon: Landmark,
  },
  {
    key: "briefcase",
    label: "Work",
    keywords: ["office", "job", "business"],
    Icon: Briefcase,
  },
  {
    key: "graduation-cap",
    label: "Education",
    keywords: ["school", "study", "learn"],
    Icon: GraduationCap,
  },
  {
    key: "utensils-crossed",
    label: "Food",
    keywords: ["cook", "meal", "kitchen", "dining"],
    Icon: UtensilsCrossed,
  },
  {
    key: "car",
    label: "Car",
    keywords: ["drive", "vehicle", "auto"],
    Icon: Car,
  },
  {
    key: "wrench",
    label: "Maintenance",
    keywords: ["repair", "fix", "tools"],
    Icon: Wrench,
  },
  {
    key: "dumbbell",
    label: "Fitness",
    keywords: ["gym", "exercise", "sport"],
    Icon: Dumbbell,
  },
  {
    key: "leaf",
    label: "Garden",
    keywords: ["plants", "outdoor", "nature"],
    Icon: Leaf,
  },
  {
    key: "paw-print",
    label: "Pets",
    keywords: ["dog", "cat", "animal"],
    Icon: PawPrint,
  },
  {
    key: "baby",
    label: "Family",
    keywords: ["kids", "child", "parent"],
    Icon: Baby,
  },
  {
    key: "sparkles",
    label: "Personal",
    keywords: ["self", "misc", "other"],
    Icon: Sparkles,
  },
] as const;

const iconByKey = new Map<string, LucideIcon>(
  TODO_TAG_ICON_OPTIONS.map((o) => [o.key, o.Icon]),
);

export function todoTagIconComponent(key: string | null | undefined): LucideIcon {
  if (!key) return Tag;
  return iconByKey.get(key) ?? Tag;
}

export function isValidTodoTagIcon(key: string): boolean {
  return iconByKey.has(key);
}

export function filterTodoTagIcons(query: string): TodoTagIconOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...TODO_TAG_ICON_OPTIONS];
  return TODO_TAG_ICON_OPTIONS.filter((o) => {
    const haystack = [o.key, o.label, ...o.keywords].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

/** Suggested starter tags shown when the registry is empty. */
export const TODO_TAG_PRESETS: readonly { label: string; icon: string }[] = [
  { label: "Home", icon: "home" },
  { label: "Health", icon: "heart-pulse" },
  { label: "Shopping", icon: "shopping-cart" },
  { label: "Travel", icon: "plane" },
  { label: "Finances", icon: "wallet" },
  { label: "Work", icon: "briefcase" },
];

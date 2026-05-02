import { MarkerType, type Edge, type Node } from "@xyflow/react";

export type ArchitectureNodeData = Record<string, unknown> & {
  area: string;
  title: string;
  description: string;
};

export type ArchitectureNode = Node<ArchitectureNodeData, "featureNode">;

export const architectureNodes: ArchitectureNode[] = [
  {
    id: "idea",
    type: "featureNode",
    position: { x: 0, y: 180 },
    data: {
      area: "Business idea",
      title: "Karriqi family hub",
      description: "A mobile-first home base for daily family coordination.",
    },
  },
  {
    id: "auth",
    type: "featureNode",
    position: { x: 320, y: 20 },
    data: {
      area: "Access",
      title: "Supabase Auth",
      description: "Email sessions protect family data and maintainer tools.",
    },
  },
  {
    id: "shell",
    type: "featureNode",
    position: { x: 320, y: 180 },
    data: {
      area: "App shell",
      title: "Authenticated shell",
      description: "Shared layout, sidebar, bottom nav, theme, and toasts.",
    },
  },
  {
    id: "supabase",
    type: "featureNode",
    position: { x: 320, y: 340 },
    data: {
      area: "Data",
      title: "Supabase database",
      description: "RLS-backed records for shopping, tasks, and notifications.",
    },
  },
  {
    id: "dashboard",
    type: "featureNode",
    position: { x: 680, y: -80 },
    data: {
      area: "Feature",
      title: "Dashboard",
      description: "At-a-glance entry point for the household.",
    },
  },
  {
    id: "shopping",
    type: "featureNode",
    position: { x: 680, y: 80 },
    data: {
      area: "Feature",
      title: "Shopping",
      description: "Staples, list building, completion, and admin catalog.",
    },
  },
  {
    id: "todo",
    type: "featureNode",
    position: { x: 680, y: 240 },
    data: {
      area: "Feature",
      title: "To-do",
      description: "Family tasks with assignment, priority, and detail views.",
    },
  },
  {
    id: "calendar",
    type: "featureNode",
    position: { x: 680, y: 400 },
    data: {
      area: "Feature",
      title: "Calendar",
      description: "Shared schedule surface for future event workflows.",
    },
  },
  {
    id: "notifications",
    type: "featureNode",
    position: { x: 1040, y: 120 },
    data: {
      area: "Cross-cutting",
      title: "Notifications",
      description:
        "Creates notification rows and dispatches delivery channels.",
    },
  },
  {
    id: "push",
    type: "featureNode",
    position: { x: 1040, y: 280 },
    data: {
      area: "Delivery",
      title: "Web push",
      description: "VAPID sends to saved subscriptions and the service worker.",
    },
  },
  {
    id: "settings",
    type: "featureNode",
    position: { x: 1400, y: 80 },
    data: {
      area: "Control",
      title: "Settings",
      description: "Profile, push subscription, and Dev opt-in controls.",
    },
  },
  {
    id: "dev",
    type: "featureNode",
    position: { x: 1400, y: 240 },
    data: {
      area: "Maintainer",
      title: "Dev tools",
      description: "Push tests and this living architecture map.",
    },
  },
];

export const architectureEdges: Edge[] = [
  { id: "idea-shell", source: "idea", target: "shell", animated: true },
  { id: "auth-shell", source: "auth", target: "shell", animated: true },
  { id: "auth-settings", source: "auth", target: "settings", animated: true },
  { id: "shell-dashboard", source: "shell", target: "dashboard" },
  { id: "shell-shopping", source: "shell", target: "shopping" },
  { id: "shell-todo", source: "shell", target: "todo" },
  { id: "shell-calendar", source: "shell", target: "calendar" },
  { id: "shell-settings", source: "shell", target: "settings" },
  { id: "shell-dev", source: "shell", target: "dev", animated: true },
  { id: "shopping-data", source: "shopping", target: "supabase" },
  { id: "todo-data", source: "todo", target: "supabase" },
  { id: "settings-push", source: "settings", target: "push", animated: true },
  {
    id: "notifications-data",
    source: "notifications",
    target: "supabase",
  },
  {
    id: "notifications-push",
    source: "notifications",
    target: "push",
    animated: true,
  },
  { id: "push-dev", source: "dev", target: "push", animated: true },
].map((edge) => ({
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2 },
  ...edge,
}));

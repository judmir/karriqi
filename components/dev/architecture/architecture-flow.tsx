"use client";

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type NodeProps,
} from "@xyflow/react";

import {
  architectureEdges,
  architectureNodes,
  type ArchitectureNode,
} from "@/components/dev/architecture/architecture-flow-data";

function ArchitectureFeatureNode({ data }: NodeProps<ArchitectureNode>) {
  return (
    <article className="border-border bg-card text-card-foreground shadow-black/20 min-w-64 rounded-2xl border p-4 shadow-lg">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !size-2"
      />
      <div className="text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
        {data.area}
      </div>
      <h2 className="mt-2 text-sm font-semibold leading-snug">{data.title}</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        {data.description}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary !size-2"
      />
    </article>
  );
}

const nodeTypes = {
  featureNode: ArchitectureFeatureNode,
};

export function ArchitectureFlow() {
  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="border-border border-b px-4 py-3 sm:px-6">
        <h2 className="text-foreground text-sm font-semibold">
          Karriqi feature map
        </h2>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Pan, zoom, or drag the canvas to inspect how product features connect
          to shared services.
        </p>
      </div>
      <div className="h-[34rem] sm:h-[42rem]">
        <ReactFlow
          nodes={architectureNodes}
          edges={architectureEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.35}
          maxZoom={1.35}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background color="var(--border)" gap={24} />
          <MiniMap
            pannable
            zoomable
            className="!bg-card !border-border !hidden !rounded-xl !border sm:!block"
            maskColor="color-mix(in oklch, var(--background) 72%, transparent)"
            nodeColor="var(--muted)"
            nodeStrokeColor="var(--border)"
          />
          <Controls
            className="!bg-card !border-border !overflow-hidden !rounded-xl !border"
            showInteractive={false}
          />
        </ReactFlow>
      </div>
    </section>
  );
}

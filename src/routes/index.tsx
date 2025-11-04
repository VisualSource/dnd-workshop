import { createFileRoute } from '@tanstack/react-router'
import { Application } from "@pixi/react";
import { useRef } from 'react';

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const containerRef = useRef(null);


  return (
    <div ref={containerRef} className="h-full w-full">
       <Application resizeTo={containerRef} autoStart sharedTicker/>
    </div>
  )
}
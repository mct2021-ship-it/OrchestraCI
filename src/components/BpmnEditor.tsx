import React, { useEffect, useRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';
// @ts-ignore
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css';

const DEFAULT_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" targetNamespace="http://bpmn.io/schema/bpmn" id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="173.0" y="102.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

interface BpmnEditorProps {
  xml?: string;
  onUpdate: (xml: string) => void;
  canEdit?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export function BpmnEditor({ xml, onUpdate, canEdit = true, isFullScreen, onToggleFullScreen }: BpmnEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const propertiesRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !propertiesRef.current) return;

    modelerRef.current = new BpmnModeler({
      container: containerRef.current,
      propertiesPanel: {
        parent: propertiesRef.current
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule
      ],
      keyboard: {
        bindTo: window
      }
    });

    const initMap = async () => {
      try {
        await modelerRef.current.importXML(xml && xml.trim() !== '' ? xml : DEFAULT_BPMN_XML);
        const canvas = modelerRef.current.get('canvas');
        canvas.zoom('fit-viewport');
      } catch (err) {
        console.error('could not import BPMN 2.0 diagram', err);
      }
    };

    initMap();

    const changeListener = () => {
      modelerRef.current.saveXML({ format: true }).then(({ xml }: any) => {
        onUpdate(xml);
      }).catch((err: any) => console.error(err));
    };

    modelerRef.current.on('commandStack.changed', changeListener);

    return () => {
      modelerRef.current.destroy();
    };
  }, []); // Initialization run once
  
  // We don't want to re-import on every tick, handled via internal state of bpmn-js

  return (
    <div className={cn(
      "w-full bg-zinc-50 dark:bg-slate-200 relative border-t border-zinc-200 dark:border-zinc-800 transition-all flex",
      isFullScreen ? "fixed inset-0 z-[100] h-screen" : "h-[700px]"
    )}>
      <div className="flex-1 relative" ref={containerRef}></div>
      <div className="w-[300px] border-l border-zinc-200 bg-white overflow-y-auto" ref={propertiesRef}></div>
      
      {onToggleFullScreen && (
        <button
          onClick={onToggleFullScreen}
          style={{ zIndex: 1000 }}
          className="absolute top-4 right-4 p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 transition-colors"
          title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
        >
          {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      )}
      
      {!canEdit && (
        <div className="absolute inset-0 bg-transparent z-[999] opacity-0" title="View Only Mode"></div>
      )}
    </div>
  );
}

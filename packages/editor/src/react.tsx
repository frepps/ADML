/**
 * React wrapper for ADML Editor
 */

import { useEffect, useRef } from 'react';
import { ADMLEditor, ADMLEditorOptions } from './index';

export interface ADMLEditorReactProps extends Omit<ADMLEditorOptions, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function ADMLEditorReact({
  value = '',
  onChange,
  className,
  ...options
}: ADMLEditorReactProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ADMLEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    editorRef.current = new ADMLEditor(containerRef.current, {
      ...options,
      initialValue: value,
      onChange
    });

    return () => {
      editorRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return <div ref={containerRef} className={className} />;
}

export default ADMLEditorReact;

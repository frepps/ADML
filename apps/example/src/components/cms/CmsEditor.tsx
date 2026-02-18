import { useState, useCallback, useRef, useEffect } from 'react';
import { ADMLEditorReact } from '@adml/editor';

interface Props {
  slug: string;
  initialContent: string;
}

export default function CmsEditor({ slug, initialContent }: Props) {
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const contentRef = useRef(initialContent);

  const handleChange = useCallback(
    (value: string) => {
      contentRef.current = value;

      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        await fetch(`/api/articles/${slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: value }),
        });
        setSaving(false);

        // Refresh preview iframe
        const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
        if (iframe) iframe.src = iframe.src;
      }, 500);
    },
    [slug]
  );

  useEffect(() => {
    return () => clearTimeout(saveTimeoutRef.current);
  }, []);

  return (
    <div className="cms-editor-wrapper">
      <div className="cms-editor-toolbar">
        <a href="/cms" className="cms-editor-back">Back</a>
        <span className="cms-editor-slug">{slug}</span>
        {saving && <span className="cms-editor-status">Saving...</span>}
      </div>
      <ADMLEditorReact
        value={initialContent}
        onChange={handleChange}
        className="cms-editor-input"
      />
    </div>
  );
}

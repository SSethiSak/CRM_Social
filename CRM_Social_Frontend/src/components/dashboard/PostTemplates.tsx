import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Trash2, FileText, Copy, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

const TEMPLATES_STORAGE_KEY = 'smcrm_post_templates';

function loadTemplates(): PostTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: PostTemplate[]) {
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

interface PostTemplatesProps {
  onUseTemplate: (content: string) => void;
  currentContent?: string;
}

export function PostTemplates({ onUseTemplate, currentContent }: PostTemplatesProps) {
  const [templates, setTemplates] = useState<PostTemplate[]>(loadTemplates);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    saveTemplates(templates);
  }, [templates]);

  const handleSaveTemplate = () => {
    if (!newName.trim() || !currentContent?.trim()) return;

    const template: PostTemplate = {
      id: Date.now().toString(),
      name: newName.trim(),
      content: currentContent,
      createdAt: new Date().toISOString(),
    };

    setTemplates(prev => [template, ...prev]);
    setNewName('');
    setIsCreating(false);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Templates
          </CardTitle>
          {!isCreating && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(true)}
              disabled={!currentContent?.trim()}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 text-xs"
              title={!currentContent?.trim() ? 'Write some content first' : 'Save current content as template'}
            >
              <BookmarkPlus className="w-4 h-4 mr-1" />
              Save Current
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Save template form */}
        {isCreating && (
          <div className="space-y-2 p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Template name..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveTemplate}
                disabled={!newName.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs flex-1"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setIsCreating(false); setNewName(''); }}
                className="text-slate-400 hover:text-white text-xs"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Template list */}
        {templates.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">
            No templates yet. Write a post and save it as a template.
          </p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="group p-3 rounded-lg border border-slate-700/50 bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-white truncate">{template.name}</p>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    onClick={() => onUseTemplate(template.content)}
                    title="Use this template"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{template.content}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, Link, Image as ImageIcon, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface MediaUploaderProps {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  maxItems?: number;
}

export function MediaUploader({ media, onChange, maxItems = 10 }: MediaUploaderProps) {
  const [urlInput, setUrlInput] = useState("");
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addMediaFromUrl = () => {
    if (!urlInput.trim()) return;

    const newMedia: MediaItem = {
      id: Date.now().toString(),
      type: mediaType,
      url: urlInput.trim(),
    };

    if (media.length >= maxItems) {
      toast({
        title: "Limite atingido",
        description: `Máximo de ${maxItems} itens de mídia permitido`,
        variant: "destructive",
      });
      return;
    }

    onChange([...media, newMedia]);
    setUrlInput("");
  };

  const removeMedia = (id: string) => {
    onChange(media.filter(item => item.id !== id));
  };

  const reorderMedia = (fromIndex: number, toIndex: number) => {
    const newMedia = [...media];
    const [removed] = newMedia.splice(fromIndex, 1);
    newMedia.splice(toIndex, 0, removed);
    onChange(newMedia);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (media.length >= maxItems) {
        toast({
          title: "Limite atingido",
          description: `Máximo de ${maxItems} itens de mídia permitido`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newMedia: MediaItem = {
          id: Date.now().toString() + Math.random(),
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: result,
        };
        onChange([...media, newMedia]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Mídia do Produto ({media.length}/{maxItems})
        </Label>
      </div>

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item, index) => (
            <Card key={item.id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                      <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                        VIDEO
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-xs text-center mt-1 text-muted-foreground">
                  {index === 0 && "Principal"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Controls */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Upload de Arquivo</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Adicionar por URL</Label>
            <div className="flex gap-2">
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
                className="px-3 py-2 border rounded text-sm"
              >
                <option value="image">Imagem</option>
                <option value="video">Vídeo</option>
              </select>
              <Input
                placeholder="URL da mídia"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addMediaFromUrl} size="sm" disabled={!urlInput.trim()}>
                <Link className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          A primeira imagem será usada como imagem principal do produto. Arraste para reordenar.
        </div>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bold, 
  Italic, 
  Underline, 
  Code, 
  Heading, 
  Quote, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Link 
} from "lucide-react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  minHeight?: string;
}

export function Editor({
  value,
  onChange,
  onImageUpload,
  placeholder = "Start writing your blog post here...",
  minHeight = "300px"
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const applyFormatting = (prefix: string, suffix = prefix) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newText = beforeText + prefix + selectedText + suffix + afterText;
    onChange(newText);

    // Set selection to after the formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = end + prefix.length;
    }, 0);
  };

  const handleImageUpload = async () => {
    if (!fileInputRef.current || !onImageUpload) return;
    fileInputRef.current.click();
  };

  const processImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !onImageUpload) return;
    
    const file = e.target.files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 10MB.");
      e.target.value = '';
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file (JPEG, PNG, GIF, etc.)");
      e.target.value = '';
      return;
    }
    
    console.log("Uploading image in editor:", {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    setIsUploading(true);
    
    try {
      // Insert a placeholder at cursor position
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const textBefore = value.substring(0, cursorPos);
        const textAfter = value.substring(cursorPos);
        
        const placeholder = `\n\n![Uploading ${file.name}...]()\n\n`;
        onChange(textBefore + placeholder + textAfter);
      }
      
      // Upload the image
      console.log("Calling onImageUpload function");
      const imageUrl = await onImageUpload(file);
      console.log("Image upload succeeded, URL:", imageUrl);
      
      // Replace the placeholder with the actual image markdown
      const imageMarkdown = `\n\n![${file.name}](${imageUrl})\n\n`;
      const updatedContent = value.replace(`\n\n![Uploading ${file.name}...]()\n\n`, imageMarkdown);
      onChange(updatedContent);
      
      console.log("Image markdown inserted into editor");
      e.target.value = '';
    } catch (error) {
      console.error("Failed to upload image:", error);
      
      // Remove the placeholder if upload failed
      const updatedContent = value.replace(`\n\n![Uploading ${file.name}...]()\n\n`, '');
      onChange(updatedContent);
      
      // Show more detailed error
      let errorMessage = "Failed to upload image. ";
      if (error instanceof Error) {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <div className="border-b border-gray-300 bg-gray-50 px-3 py-2 flex flex-wrap gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => applyFormatting('**')} 
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => applyFormatting('*')} 
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => applyFormatting('<u>', '</u>')} 
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="h-6 border-r border-gray-300 mx-1"></div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => applyFormatting('# ')} 
          title="Heading"
        >
          <Heading className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => applyFormatting('> ')} 
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => applyFormatting('- ')} 
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => applyFormatting('1. ')} 
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="h-6 border-r border-gray-300 mx-1"></div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => applyFormatting('[', '](url)')} 
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={handleImageUpload} 
          disabled={!onImageUpload || isUploading}
          title="Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => applyFormatting('```\n', '\n```')} 
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[300px] border-0 rounded-none focus-visible:ring-0 resize-y"
        style={{ minHeight }}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={processImageUpload}
      />
    </div>
  );
}

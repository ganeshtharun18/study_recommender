
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Film, Package, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MaterialType = "PDF" | "Video" | "Interactive";

const MaterialUpload = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [materialType, setMaterialType] = useState<MaterialType>("PDF");
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!title || !subject || (materialType === "PDF" && !file) || (materialType === "Video" && !youtubeUrl)) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    
    // Simulate API call with some delay
    setTimeout(() => {
      toast.success("Material uploaded successfully!");
      setLoading(false);
      navigate("/materials");
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Upload Study Material</h1>
        <p className="text-muted-foreground">Share educational resources with students</p>
      </div>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>New Study Material</CardTitle>
          <CardDescription>
            Fill out the form below to upload a new study resource
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-base">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of this material"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 h-24 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-base">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="E.g. Mathematics, Physics, Computer Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-base">
                  Material Type <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={materialType}
                  onValueChange={(value) => setMaterialType(value as MaterialType)}
                  className="flex flex-col sm:flex-row gap-4 mt-1.5"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PDF" id="pdf" />
                    <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                      <FileText className="h-4 w-4 mr-2 text-edu-primary" />
                      PDF Document
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Video" id="video" />
                    <Label htmlFor="video" className="flex items-center cursor-pointer">
                      <Film className="h-4 w-4 mr-2 text-edu-accent" />
                      Video / YouTube
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Interactive" id="interactive" />
                    <Label htmlFor="interactive" className="flex items-center cursor-pointer">
                      <Package className="h-4 w-4 mr-2 text-edu-secondary" />
                      Interactive Content
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Conditionally show file upload or YouTube URL input */}
              {materialType === "PDF" && (
                <div>
                  <Label className="text-base">Upload File <span className="text-destructive">*</span></Label>
                  
                  {!file ? (
                    <div className="mt-1.5 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                        <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF (up to 50MB)</p>
                      </label>
                    </div>
                  ) : (
                    <div className="mt-1.5 p-3 border rounded-md flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-edu-primary" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {materialType === "Video" && (
                <div>
                  <Label htmlFor="youtube-url" className="text-base">
                    YouTube URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Paste the full YouTube video URL
                  </p>
                </div>
              )}

              {materialType === "Interactive" && (
                <div>
                  <Label className="text-base">
                    Interactive Content Setup <span className="text-destructive">*</span>
                  </Label>
                  <div className="mt-1.5 p-4 rounded-lg border border-dashed flex flex-col items-center justify-center">
                    <Package className="h-8 w-8 mb-2 text-edu-secondary" />
                    <p className="text-sm text-center mb-2">Interactive content builder will open after initial setup</p>
                    <Button type="button" className="bg-edu-secondary hover:bg-edu-secondary/90">
                      Open Interactive Builder
                    </Button>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <Label htmlFor="tags" className="text-base">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Add tags separated by commas"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Optional. Add relevant tags to help students find your content.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className={cn(
                  "bg-edu-primary hover:bg-edu-primary/90",
                  loading && "opacity-70 cursor-not-allowed"
                )}
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload Material"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialUpload;

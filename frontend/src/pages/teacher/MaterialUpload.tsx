import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

// Define types for better type safety
type MaterialType = "PDF" | "Video" | "Article"; // Updated to match your DB enum
type DifficultyLevel = "Easy" | "Medium" | "Hard";

interface FormData {
  title: string;
  description: string;
  topic: string;
  materialType: MaterialType;
  difficulty: DifficultyLevel;
  file: File | null;
  youtubeUrl: string;
  subjectId?: number;
}

const MaterialUpload = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    topic: "",
    materialType: "PDF",
    difficulty: "Medium",
    file: null,
    youtubeUrl: "",
    subjectId: 1, // Default subject ID
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
  };

  const handleTypeChange = (value: MaterialType) => {
    setFormData((prev) => ({ ...prev, materialType: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!formData.topic.trim()) {
      toast.error("Topic is required");
      return false;
    }
    if (formData.materialType === "PDF" && !formData.file) {
      toast.error("PDF file is required");
      return false;
    }
    if (formData.materialType === "Video" && !formData.youtubeUrl.trim()) {
      toast.error("YouTube URL is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("topic", formData.topic);
      data.append("type", formData.materialType);
      data.append("difficulty", formData.difficulty);
      data.append("subject_id", formData.subjectId?.toString() || "1");
      data.append("uploaded_by", "current_user_id"); // Replace with actual auth

      if (formData.materialType === "PDF" && formData.file) {
        data.append("file", formData.file);
      } else if (formData.materialType === "Video") {
        data.append("url", formData.youtubeUrl);
      }

      const response = await axios.post("/api/material/upload", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Material uploaded successfully!");
      navigate("/materials");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        axios.isAxiosError(error) 
          ? error.response?.data?.message || "Upload failed"
          : "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Upload Study Material</h1>
        <p className="text-muted-foreground">
          Share educational resources with students
        </p>
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
              {/* Title Field */}
              <div>
                <Label htmlFor="title" className="text-base">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter a descriptive title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  disabled={loading}
                />
              </div>

              {/* Description Field */}
              <div>
                <Label htmlFor="description" className="text-base">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide a detailed description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1.5 h-24 resize-none"
                  disabled={loading}
                />
              </div>

              {/* Topic Field */}
              <div>
                <Label htmlFor="topic" className="text-base">
                  Topic <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="topic"
                  name="topic"
                  placeholder="E.g. Mathematics, Physics"
                  value={formData.topic}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  disabled={loading}
                />
              </div>

              {/* Difficulty Field */}
              <div>
                <Label htmlFor="difficulty" className="text-base">
                  Difficulty
                </Label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Material Type Selection */}
              <div>
                <Label className="text-base">
                  Material Type <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formData.materialType}
                  onValueChange={handleTypeChange}
                  className="flex flex-col sm:flex-row gap-4 mt-1.5"
                  disabled={loading}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PDF" id="pdf" />
                    <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      PDF Document
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Video" id="video" />
                    <Label htmlFor="video" className="flex items-center cursor-pointer">
                      <Film className="h-4 w-4 mr-2 text-red-500" />
                      Video / YouTube
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Article" id="article" />
                    <Label htmlFor="article" className="flex items-center cursor-pointer">
                      <Package className="h-4 w-4 mr-2 text-green-500" />
                      Article
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* File Upload for PDF */}
              {formData.materialType === "PDF" && (
                <div>
                  <Label className="text-base">
                    Upload File <span className="text-destructive">*</span>
                  </Label>
                  
                  {!formData.file ? (
                    <div className="mt-1.5 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileChange}
                        disabled={loading}
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
                        <FileText className="h-5 w-5 mr-2 text-blue-500" />
                        <span className="text-sm">{formData.file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* YouTube URL for Videos */}
              {formData.materialType === "Video" && (
                <div>
                  <Label htmlFor="youtube-url" className="text-base">
                    YouTube URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="youtube-url"
                    name="youtubeUrl"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    className="mt-1.5"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Paste the full YouTube video URL
                  </p>
                </div>
              )}

              {/* Subject ID (hidden by default) */}
              <input 
                type="hidden" 
                name="subjectId" 
                value={formData.subjectId} 
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className={cn(
                  "bg-blue-600 hover:bg-blue-700 text-white",
                  loading && "opacity-70 cursor-not-allowed"
                )}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : "Upload Material"}
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
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import axios from "axios";
import api from "@/api/axios";
import { Skeleton } from "../ui/skeleton";

function  ProductImageUpload({
  imageFile,
  setImageFile,
  imageLoadingState,
  uploadedImageUrl,
  setUploadedImageUrl,
  setImageLoadingState,
  isEditMode,
  isCustomStyling = false,
  onImageUpload, // New prop for handling upload
}) {
  const inputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  function handleImageFileChange(event) {
    console.log(event.target.files, "event.target.files");
    const selectedFile = event.target.files?.[0];
    console.log(selectedFile);

    if (selectedFile) {
      compressImage(selectedFile);
    }
  }

  function handleDragOver(event) {
    event.preventDefault()
  }

  function handleDrop(event) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      compressImage(droppedFile);
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  function compressImage(file) {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function() {
      // Calculate new dimensions (max width/height of 1200px)
      let { width, height } = img;
      const maxSize = 1200;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            console.log('Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
            console.log('Compressed size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
            
            setImageFile(compressedFile);
          }
        },
        'image/jpeg',
        0.7 // Compression quality (0.7 = 70% quality)
      );
    };

    img.src = URL.createObjectURL(file);
  }

async function uploadImageToCloudinary() {
  if (!imageFile) return;
  
  setImageLoadingState(true);
  setUploadProgress(0);
  
  // Simulate progress for better UX
  const progressInterval = setInterval(() => {
    setUploadProgress(prev => {
      if (prev >= 90) {
        clearInterval(progressInterval);
        return 90;
      }
      return prev + 10;
    });
  }, 100);
  
  try {
    const data = new FormData();
    data.append("my_file", imageFile);
    
    const response = await api.post(
      "/admin/products/upload-image",
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    console.log(response.data, "response");

    // Complete progress
    setUploadProgress(100);
    
    // FIX: Access correct properties
    if (response?.data?.success) {
      const imageUrl = response.data.url;
      setUploadedImageUrl(imageUrl);
      setImageLoadingState(false);
      
      // Call the callback with the uploaded URL
      if (onImageUpload) {
        onImageUpload(imageUrl);
      }
    }
     } catch (error) {
     console.error("Upload failed:", error.response?.data || error.message);
     setImageLoadingState(false);
   }
}

// Remove automatic upload - image will only upload when form is submitted
// useEffect(() => {
//   if (imageFile && !imageLoadingState) {
//     uploadImageToCloudinary();
//   }
// }, [imageFile]);

// Expose upload function for external use
const uploadImage = () => {
  if (imageFile && !imageLoadingState) {
    uploadImageToCloudinary();
  }
};

// Expose upload function to parent component
useEffect(() => {
  if (typeof window !== 'undefined') {
    window.uploadImageToCloudinary = uploadImage;
  }
}, [imageFile, imageLoadingState]);

  return (
    <div
      className={`w-full  mt-4 ${isCustomStyling ? "" : "max-w-md mx-auto"}`}
    >
      <Label className="text-lg font-semibold mb-2 block">Upload Image</Label>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`${
          isEditMode ? "opacity-60" : ""
        } border-2 border-dashed rounded-lg p-4`}
      >
        <Input
          id="image-upload"
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleImageFileChange}
          disabled={isEditMode}
        />
        {!imageFile ? (
          <Label
            htmlFor="image-upload"
            className={`${
              isEditMode ? "cursor-not-allowed" : ""
            } flex flex-col items-center justify-center h-32 cursor-pointer`}
          >
            <UploadCloudIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <span>Drag & drop or click to upload image</span>
          </Label>
                 ) : (
           <div className="relative p-4 bg-gray-50 rounded-lg border border-gray-200">
             <div className="flex items-center space-x-3 pr-8">
               <div className="flex-shrink-0">
                 <FileIcon className="w-10 h-10 text-blue-600" />
               </div>
               <div className="min-w-0 flex-1">
                 <p className="text-sm font-medium text-gray-900 truncate">
                   {imageFile.name}
                 </p>
                 <p className="text-xs text-gray-500">
                   {(imageFile.size / 1024 / 1024).toFixed(2)} MB (compressed)
                 </p>
               </div>
             </div>
             <Button
               variant="ghost"
               size="icon"
               className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
               onClick={handleRemoveImage}
             >
               <XIcon className="w-3 h-3" />
               <span className="sr-only">Remove File</span>
             </Button>
           </div>
         )}
      </div>
    </div>
  )
}

export default ProductImageUpload;
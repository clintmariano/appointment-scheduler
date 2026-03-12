import React, { useRef, useState } from 'react';
import { User, X, Loader2 } from 'lucide-react';

interface ProfilePictureUploadProps {
  imageUrl?: string;
  onImageChange: (url: string) => void;
  disabled?: boolean;
}

export function ProfilePictureUpload({ imageUrl, onImageChange, disabled = false }: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error state
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      onImageChange(data.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange('');
  };

  return (
    <div className="flex flex-col">
      <div
        onClick={handleClick}
        className={`
          relative w-32 h-32 rounded-lg border border-gray-200 bg-gray-50
          flex items-center justify-center cursor-pointer
          transition-all hover:border-teal-400 hover:bg-teal-50/50
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
          </div>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Profile"
              className="w-full h-full object-cover rounded-lg"
            />
            {!disabled && (
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                title="Remove picture"
              >
                <X size={14} />
              </button>
            )}
          </>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={48} className="text-gray-400" strokeWidth={1.5} />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {error && (
        <span className="mt-2 text-xs text-red-500 text-center">
          {error}
        </span>
      )}
    </div>
  );
}

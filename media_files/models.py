from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from django.utils import timezone
import os
import uuid
from django.conf import settings


def get_upload_path(instance, filename):
    """
    Generate upload path for media files
    """
    # Get file extension
    ext = filename.split('.')[-1]
    
    # Generate unique filename
    filename = f"{uuid.uuid4().hex}.{ext}"
    
    # Organize by file type and date
    file_type = instance.get_file_type()
    date_path = timezone.now().strftime('%Y/%m/%d')
    
    return f'uploads/{file_type}/{date_path}/{filename}'


class MediaFile(models.Model):
    """
    Model for handling all types of media files
    """
    
    FILE_TYPES = [
        ('image', 'Image'),
        ('document', 'Document'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('other', 'Other'),
    ]
    
    # Basic file information
    file = models.FileField(
        upload_to=get_upload_path,
        validators=[
            FileExtensionValidator(
                allowed_extensions=[
                    # Images
                    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
                    # Documents
                    'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
                    # Videos
                    'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
                    # Audio
                    'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a',
                    # Archives
                    'zip', 'rar', '7z', 'tar', 'gz',
                ]
            )
        ]
    )
    
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    file_size = models.PositiveIntegerField()  # Size in bytes
    mime_type = models.CharField(max_length=100)
    
    # Image-specific fields
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    
    # Metadata
    alt_text = models.CharField(max_length=255, blank=True)
    caption = models.TextField(blank=True)
    description = models.TextField(blank=True)
    
    # Upload information
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_files')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Usage tracking
    download_count = models.PositiveIntegerField(default=0)
    is_public = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # SEO and organization
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['file_type', '-uploaded_at']),
            models.Index(fields=['uploaded_by', '-uploaded_at']),
            models.Index(fields=['is_public', '-uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.original_filename} ({self.file_type})"
    
    def save(self, *args, **kwargs):
        # Set file metadata on save
        if self.file:
            self.file_size = self.file.size
            self.original_filename = self.original_filename or self.file.name
            
            # Determine file type from extension
            if not self.file_type:
                self.file_type = self.get_file_type()
        
        super().save(*args, **kwargs)
    
    def get_file_type(self):
        """
        Determine file type based on extension
        """
        if not self.file:
            return 'other'
        
        ext = self.file.name.split('.')[-1].lower()
        
        image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff']
        document_extensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']
        video_extensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
        audio_extensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']
        
        if ext in image_extensions:
            return 'image'
        elif ext in document_extensions:
            return 'document'
        elif ext in video_extensions:
            return 'video'
        elif ext in audio_extensions:
            return 'audio'
        else:
            return 'other'
    
    def get_file_url(self):
        """
        Get the URL for the file
        """
        if self.file:
            return self.file.url
        return None
    
    def get_file_size_display(self):
        """
        Get human-readable file size
        """
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    
    def increment_download_count(self):
        """
        Increment download counter
        """
        self.download_count += 1
        self.save(update_fields=['download_count'])
    
    def get_tags_list(self):
        """
        Get tags as a list
        """
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
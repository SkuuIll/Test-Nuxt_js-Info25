from rest_framework import serializers
from .models import MediaFile


class MediaFileSerializer(serializers.ModelSerializer):
    """
    Serializer for MediaFile model
    """
    file_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    tags_list = serializers.SerializerMethodField()
    
    class Meta:
        model = MediaFile
        fields = [
            'id',
            'file',
            'file_url',
            'original_filename',
            'file_type',
            'file_size',
            'file_size_display',
            'mime_type',
            'width',
            'height',
            'alt_text',
            'caption',
            'description',
            'uploaded_by',
            'uploaded_by_username',
            'uploaded_at',
            'download_count',
            'is_public',
            'is_featured',
            'tags',
            'tags_list',
        ]
        read_only_fields = [
            'id',
            'file_url',
            'file_type',
            'file_size',
            'file_size_display',
            'mime_type',
            'width',
            'height',
            'uploaded_by',
            'uploaded_by_username',
            'uploaded_at',
            'download_count',
            'tags_list',
        ]
    
    def get_file_url(self, obj):
        """Get the file URL"""
        return obj.get_file_url()
    
    def get_file_size_display(self, obj):
        """Get human-readable file size"""
        return obj.get_file_size_display()
    
    def get_tags_list(self, obj):
        """Get tags as a list"""
        return obj.get_tags_list()


class MediaUploadSerializer(serializers.Serializer):
    """
    Serializer for file upload validation
    """
    file = serializers.FileField()
    alt_text = serializers.CharField(max_length=255, required=False, allow_blank=True)
    caption = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    tags = serializers.CharField(max_length=500, required=False, allow_blank=True)
    is_public = serializers.BooleanField(default=True)
    
    def validate_file(self, value):
        """Validate uploaded file"""
        # Check file size (10MB limit)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError("File size exceeds 10MB limit")
        
        # Check file extension
        allowed_extensions = [
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
        
        file_extension = value.name.split('.')[-1].lower()
        if file_extension not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type '{file_extension}' is not allowed. "
                f"Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value
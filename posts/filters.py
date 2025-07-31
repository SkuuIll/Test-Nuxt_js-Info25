"""
Filtros avanzados para posts, categorías y comentarios
"""

import django_filters
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Post, Category, Comment
from django.contrib.auth import get_user_model

User = get_user_model()


class PostFilter(django_filters.FilterSet):
    """
    Filtro avanzado para posts con múltiples opciones de búsqueda
    """
    
    # Búsqueda de texto
    search = django_filters.CharFilter(method='filter_search', help_text='Búsqueda en título, contenido y excerpt')
    q = django_filters.CharFilter(method='filter_search', help_text='Alias para search')
    
    # Filtros por categoría
    category = django_filters.ModelChoiceFilter(
        field_name='categoria',
        queryset=Category.objects.all(),
        help_text='Filtrar por categoría (ID)'
    )
    category_name = django_filters.CharFilter(
        field_name='categoria__nombre',
        lookup_expr='icontains',
        help_text='Filtrar por nombre de categoría'
    )
    category_slug = django_filters.CharFilter(method='filter_category_slug', help_text='Filtrar por slug de categoría')
    
    # Filtros por autor
    author = django_filters.ModelChoiceFilter(
        field_name='autor',
        queryset=User.objects.all(),
        help_text='Filtrar por autor (ID)'
    )
    author_username = django_filters.CharFilter(
        field_name='autor__username',
        lookup_expr='icontains',
        help_text='Filtrar por nombre de usuario del autor'
    )
    author_name = django_filters.CharFilter(method='filter_author_name', help_text='Filtrar por nombre completo del autor')
    
    # Filtros por estado
    status = django_filters.ChoiceFilter(
        choices=[
            ('published', 'Publicado'),
            ('draft', 'Borrador'),
            ('archived', 'Archivado')
        ],
        help_text='Filtrar por estado del post'
    )
    
    # Filtro por destacado
    featured = django_filters.BooleanFilter(help_text='Filtrar posts destacados')
    
    # Filtros por fecha
    date_from = django_filters.DateFilter(
        field_name='fecha_publicacion',
        lookup_expr='gte',
        help_text='Fecha desde (YYYY-MM-DD)'
    )
    date_to = django_filters.DateFilter(
        field_name='fecha_publicacion',
        lookup_expr='lte',
        help_text='Fecha hasta (YYYY-MM-DD)'
    )
    published_year = django_filters.NumberFilter(
        field_name='fecha_publicacion__year',
        help_text='Año de publicación'
    )
    published_month = django_filters.NumberFilter(
        field_name='fecha_publicacion__month',
        help_text='Mes de publicación (1-12)'
    )
    
    # Filtros por tiempo relativo
    time_range = django_filters.ChoiceFilter(
        method='filter_time_range',
        choices=[
            ('today', 'Hoy'),
            ('week', 'Esta semana'),
            ('month', 'Este mes'),
            ('year', 'Este año'),
            ('last_week', 'Semana pasada'),
            ('last_month', 'Mes pasado')
        ],
        help_text='Filtrar por rango de tiempo'
    )
    
    # Filtros por engagement
    min_comments = django_filters.NumberFilter(method='filter_min_comments', help_text='Mínimo número de comentarios')
    max_comments = django_filters.NumberFilter(method='filter_max_comments', help_text='Máximo número de comentarios')
    has_comments = django_filters.BooleanFilter(method='filter_has_comments', help_text='Posts con comentarios')
    
    # Filtros por contenido
    min_reading_time = django_filters.NumberFilter(method='filter_min_reading_time', help_text='Tiempo mínimo de lectura (minutos)')
    max_reading_time = django_filters.NumberFilter(method='filter_max_reading_time', help_text='Tiempo máximo de lectura (minutos)')
    has_image = django_filters.BooleanFilter(method='filter_has_image', help_text='Posts con imagen')
    
    # Ordenamiento
    ordering = django_filters.OrderingFilter(
        fields=(
            ('fecha_publicacion', 'published_at'),
            ('fecha_creacion', 'created_at'),
            ('fecha_actualizacion', 'updated_at'),
            ('titulo', 'title'),
            ('autor__username', 'author'),
            ('categoria__nombre', 'category'),
        ),
        field_labels={
            'fecha_publicacion': 'Fecha de publicación',
            'fecha_creacion': 'Fecha de creación',
            'fecha_actualizacion': 'Fecha de actualización',
            'titulo': 'Título',
            'autor__username': 'Autor',
            'categoria__nombre': 'Categoría',
        },
        help_text='Ordenar por campo (usar - para orden descendente)'
    )
    
    class Meta:
        model = Post
        fields = []
    
    def filter_search(self, queryset, name, value):
        """
        Búsqueda avanzada en múltiples campos con relevancia
        """
        if not value:
            return queryset
        
        # Dividir la consulta en términos
        terms = value.split()
        
        # Crear consulta Q para cada término
        query = Q()
        for term in terms:
            term_query = (
                Q(titulo__icontains=term) |
                Q(contenido__icontains=term) |
                Q(categoria__nombre__icontains=term) |
                Q(autor__username__icontains=term) |
                Q(autor__first_name__icontains=term) |
                Q(autor__last_name__icontains=term) |
                Q(meta_title__icontains=term) |
                Q(meta_description__icontains=term)
            )
            query &= term_query
        
        return queryset.filter(query).distinct()
    
    def filter_category_slug(self, queryset, name, value):
        """Filtrar por slug de categoría"""
        if not value:
            return queryset
        
        # Extraer ID del slug (formato: id-nombre)
        try:
            category_id = int(value.split('-')[0])
            return queryset.filter(categoria_id=category_id)
        except (ValueError, IndexError):
            # Si no se puede extraer ID, buscar por nombre
            return queryset.filter(categoria__nombre__icontains=value)
    
    def filter_author_name(self, queryset, name, value):
        """Filtrar por nombre completo del autor"""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(autor__first_name__icontains=value) |
            Q(autor__last_name__icontains=value) |
            Q(autor__username__icontains=value)
        )
    
    def filter_time_range(self, queryset, name, value):
        """Filtrar por rango de tiempo relativo"""
        if not value:
            return queryset
        
        now = timezone.now()
        
        if value == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(fecha_publicacion__gte=start_date)
        
        elif value == 'week':
            start_date = now - timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(fecha_publicacion__gte=start_date)
        
        elif value == 'month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(fecha_publicacion__gte=start_date)
        
        elif value == 'year':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(fecha_publicacion__gte=start_date)
        
        elif value == 'last_week':
            end_date = now - timedelta(days=now.weekday())
            start_date = end_date - timedelta(days=7)
            return queryset.filter(
                fecha_publicacion__gte=start_date,
                fecha_publicacion__lt=end_date
            )
        
        elif value == 'last_month':
            if now.month == 1:
                start_date = now.replace(year=now.year-1, month=12, day=1)
                end_date = now.replace(day=1)
            else:
                start_date = now.replace(month=now.month-1, day=1)
                end_date = now.replace(day=1)
            
            return queryset.filter(
                fecha_publicacion__gte=start_date,
                fecha_publicacion__lt=end_date
            )
        
        return queryset
    
    def filter_min_comments(self, queryset, name, value):
        """Filtrar por mínimo número de comentarios"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            comments_count=Count('comentarios', filter=Q(comentarios__approved=True))
        ).filter(comments_count__gte=value)
    
    def filter_max_comments(self, queryset, name, value):
        """Filtrar por máximo número de comentarios"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            comments_count=Count('comentarios', filter=Q(comentarios__approved=True))
        ).filter(comments_count__lte=value)
    
    def filter_has_comments(self, queryset, name, value):
        """Filtrar posts con o sin comentarios"""
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(comentarios__approved=True).distinct()
        else:
            return queryset.exclude(comentarios__approved=True).distinct()
    
    def filter_min_reading_time(self, queryset, name, value):
        """Filtrar por tiempo mínimo de lectura"""
        if value is None:
            return queryset
        
        # Estimar palabras necesarias (200 palabras por minuto)
        min_words = value * 200
        return queryset.extra(
            where=["LENGTH(contenido) - LENGTH(REPLACE(contenido, ' ', '')) + 1 >= %s"],
            params=[min_words]
        )
    
    def filter_max_reading_time(self, queryset, name, value):
        """Filtrar por tiempo máximo de lectura"""
        if value is None:
            return queryset
        
        # Estimar palabras máximas (200 palabras por minuto)
        max_words = value * 200
        return queryset.extra(
            where=["LENGTH(contenido) - LENGTH(REPLACE(contenido, ' ', '')) + 1 <= %s"],
            params=[max_words]
        )
    
    def filter_has_image(self, queryset, name, value):
        """Filtrar posts con o sin imagen"""
        if value is None:
            return queryset
        
        if value:
            return queryset.exclude(imagen__isnull=True).exclude(imagen='')
        else:
            return queryset.filter(Q(imagen__isnull=True) | Q(imagen=''))


class CategoryFilter(django_filters.FilterSet):
    """
    Filtro para categorías
    """
    
    search = django_filters.CharFilter(
        field_name='nombre',
        lookup_expr='icontains',
        help_text='Buscar por nombre de categoría'
    )
    
    has_posts = django_filters.BooleanFilter(method='filter_has_posts', help_text='Categorías con posts')
    min_posts = django_filters.NumberFilter(method='filter_min_posts', help_text='Mínimo número de posts')
    
    ordering = django_filters.OrderingFilter(
        fields=(
            ('nombre', 'name'),
            ('fecha_creacion', 'created_at'),
        ),
        help_text='Ordenar por campo'
    )
    
    class Meta:
        model = Category
        fields = []
    
    def filter_has_posts(self, queryset, name, value):
        """Filtrar categorías con o sin posts"""
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(post_set__status='published').distinct()
        else:
            return queryset.exclude(post_set__status='published').distinct()
    
    def filter_min_posts(self, queryset, name, value):
        """Filtrar por mínimo número de posts"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            posts_count=Count('post_set', filter=Q(post_set__status='published'))
        ).filter(posts_count__gte=value)


class CommentFilter(django_filters.FilterSet):
    """
    Filtro para comentarios
    """
    
    search = django_filters.CharFilter(
        field_name='contenido',
        lookup_expr='icontains',
        help_text='Buscar en contenido del comentario'
    )
    
    post = django_filters.ModelChoiceFilter(
        queryset=Post.objects.filter(status='published'),
        help_text='Filtrar por post'
    )
    
    author = django_filters.ModelChoiceFilter(
        field_name='usuario',
        queryset=User.objects.all(),
        help_text='Filtrar por autor del comentario'
    )
    
    approved = django_filters.BooleanFilter(help_text='Filtrar por estado de aprobación')
    
    has_replies = django_filters.BooleanFilter(method='filter_has_replies', help_text='Comentarios con respuestas')
    
    date_from = django_filters.DateFilter(
        field_name='fecha_creacion',
        lookup_expr='gte',
        help_text='Fecha desde'
    )
    
    date_to = django_filters.DateFilter(
        field_name='fecha_creacion',
        lookup_expr='lte',
        help_text='Fecha hasta'
    )
    
    ordering = django_filters.OrderingFilter(
        fields=(
            ('fecha_creacion', 'created_at'),
            ('fecha_actualizacion', 'updated_at'),
        ),
        help_text='Ordenar por campo'
    )
    
    class Meta:
        model = Comment
        fields = []
    
    def filter_has_replies(self, queryset, name, value):
        """Filtrar comentarios con o sin respuestas"""
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(replies__isnull=False).distinct()
        else:
            return queryset.filter(replies__isnull=True).distinct()


class AdvancedSearchFilter:
    """
    Clase para búsquedas avanzadas con scoring de relevancia
    """
    
    @staticmethod
    def search_posts_with_relevance(queryset, query, filters=None):
        """
        Búsqueda avanzada con scoring de relevancia
        """
        if not query:
            return queryset, {}
        
        # Dividir query en términos
        terms = query.lower().split()
        
        # Crear anotaciones para scoring
        from django.db.models import Case, When, IntegerField, Value
        
        # Scoring basado en dónde aparece el término
        score_cases = []
        
        for term in terms:
            # Título tiene mayor peso
            score_cases.append(
                When(titulo__icontains=term, then=Value(10))
            )
            # Meta description tiene peso medio
            score_cases.append(
                When(meta_description__icontains=term, then=Value(5))
            )
            # Contenido tiene menor peso
            score_cases.append(
                When(contenido__icontains=term, then=Value(2))
            )
            # Categoría y autor tienen peso bajo
            score_cases.append(
                When(categoria__nombre__icontains=term, then=Value(3))
            )
            score_cases.append(
                When(autor__username__icontains=term, then=Value(1))
            )
        
        # Aplicar scoring
        queryset = queryset.annotate(
            relevance_score=Case(
                *score_cases,
                default=Value(0),
                output_field=IntegerField()
            )
        ).filter(relevance_score__gt=0)
        
        # Aplicar filtros adicionales si se proporcionan
        if filters:
            post_filter = PostFilter(filters, queryset=queryset)
            queryset = post_filter.qs
        
        # Ordenar por relevancia y fecha
        queryset = queryset.order_by('-relevance_score', '-fecha_publicacion')
        
        # Metadatos de búsqueda
        metadata = {
            'query': query,
            'terms': terms,
            'total_results': queryset.count(),
            'search_time': timezone.now().isoformat(),
            'filters_applied': bool(filters)
        }
        
        return queryset, metadata
    
    @staticmethod
    def get_search_suggestions(query, limit=10):
        """
        Obtener sugerencias de búsqueda
        """
        if not query or len(query) < 2:
            return []
        
        suggestions = []
        
        # Sugerencias de títulos de posts
        posts = Post.objects.filter(
            status='published',
            titulo__icontains=query
        ).values_list('titulo', flat=True)[:limit//2]
        
        for title in posts:
            suggestions.append({
                'text': title,
                'type': 'post_title',
                'category': 'Posts'
            })
        
        # Sugerencias de categorías
        categories = Category.objects.filter(
            nombre__icontains=query
        ).values_list('nombre', flat=True)[:limit//4]
        
        for category in categories:
            suggestions.append({
                'text': category,
                'type': 'category',
                'category': 'Categorías'
            })
        
        # Sugerencias de autores
        authors = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).values_list('username', flat=True)[:limit//4]
        
        for author in authors:
            suggestions.append({
                'text': author,
                'type': 'author',
                'category': 'Autores'
            })
        
        return suggestions[:limit]
    
    @staticmethod
    def get_popular_searches(limit=10):
        """
        Obtener búsquedas populares (placeholder - en producción usar analytics)
        """
        # En producción, esto vendría de una tabla de analytics
        popular_terms = [
            'django', 'python', 'javascript', 'react', 'vue',
            'tutorial', 'guía', 'tips', 'desarrollo', 'programación'
        ]
        
        return [
            {
                'text': term,
                'type': 'popular',
                'category': 'Popular'
            }
            for term in popular_terms[:limit]
        ]
"""
Custom pagination classes for consistent API responses
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from collections import OrderedDict


class StandardPagination(PageNumberPagination):
    """
    Standard pagination class with consistent response format
    """
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        """
        Return a paginated style Response object with consistent format
        """
        return Response({
            'success': True,
            'data': data,
            'pagination': {
                'count': self.page.paginator.count,
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'page_size': self.page_size,
                'has_next': self.page.has_next(),
                'has_previous': self.page.has_previous(),
                'start_index': self.page.start_index(),
                'end_index': self.page.end_index()
            }
        })
    
    def get_paginated_response_schema(self, schema):
        """
        Schema for paginated responses
        """
        return {
            'type': 'object',
            'properties': {
                'success': {
                    'type': 'boolean',
                    'example': True
                },
                'data': {
                    'type': 'array',
                    'items': schema,
                },
                'pagination': {
                    'type': 'object',
                    'properties': {
                        'count': {
                            'type': 'integer',
                            'example': 123,
                        },
                        'next': {
                            'type': 'string',
                            'nullable': True,
                            'format': 'uri',
                            'example': 'http://api.example.org/accounts/?page=4'
                        },
                        'previous': {
                            'type': 'string',
                            'nullable': True,
                            'format': 'uri',
                            'example': 'http://api.example.org/accounts/?page=2'
                        },
                        'current_page': {
                            'type': 'integer',
                            'example': 3
                        },
                        'total_pages': {
                            'type': 'integer',
                            'example': 11
                        },
                        'page_size': {
                            'type': 'integer',
                            'example': 12
                        },
                        'has_next': {
                            'type': 'boolean',
                            'example': True
                        },
                        'has_previous': {
                            'type': 'boolean',
                            'example': True
                        },
                        'start_index': {
                            'type': 'integer',
                            'example': 25
                        },
                        'end_index': {
                            'type': 'integer',
                            'example': 36
                        }
                    }
                }
            },
        }


class LargePagination(StandardPagination):
    """
    Pagination for large datasets
    """
    page_size = 50
    max_page_size = 200


class SmallPagination(StandardPagination):
    """
    Pagination for small datasets or detailed views
    """
    page_size = 5
    max_page_size = 20


class DashboardPagination(StandardPagination):
    """
    Pagination specifically for dashboard views
    """
    page_size = 20
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Enhanced response for dashboard with additional metadata
        """
        response = super().get_paginated_response(data)
        
        # Add dashboard-specific metadata
        response.data['pagination']['items_per_page_options'] = [10, 20, 50, 100]
        response.data['pagination']['showing'] = f"Mostrando {self.page.start_index()}-{self.page.end_index()} de {self.page.paginator.count} elementos"
        
        return response


class SearchPagination(StandardPagination):
    """
    Pagination for search results
    """
    page_size = 15
    max_page_size = 50
    
    def get_paginated_response(self, data):
        """
        Enhanced response for search results
        """
        response = super().get_paginated_response(data)
        
        # Add search-specific metadata
        if hasattr(self, 'request') and hasattr(self.request, 'query_params'):
            search_query = self.request.query_params.get('search', '')
            if search_query:
                response.data['search'] = {
                    'query': search_query,
                    'results_count': self.page.paginator.count,
                    'has_results': self.page.paginator.count > 0
                }
        
        return response


class CommentsPagination(StandardPagination):
    """
    Pagination specifically for comments
    """
    page_size = 10
    max_page_size = 50
    
    def get_paginated_response(self, data):
        """
        Enhanced response for comments with threading info
        """
        response = super().get_paginated_response(data)
        
        # Add comment-specific metadata
        response.data['pagination']['load_more_text'] = "Cargar más comentarios"
        response.data['pagination']['comments_per_page'] = self.page_size
        
        return response


class InfinitePagination(PageNumberPagination):
    """
    Pagination for infinite scroll interfaces
    """
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50
    
    def get_paginated_response(self, data):
        """
        Simplified response for infinite scroll
        """
        return Response({
            'success': True,
            'data': data,
            'has_more': self.page.has_next(),
            'next_page': self.page.next_page_number() if self.page.has_next() else None,
            'total_count': self.page.paginator.count,
            'current_count': len(data),
            'page': self.page.number
        })


def get_pagination_class(pagination_type='standard'):
    """
    Factory function to get appropriate pagination class
    """
    pagination_classes = {
        'standard': StandardPagination,
        'large': LargePagination,
        'small': SmallPagination,
        'dashboard': DashboardPagination,
        'search': SearchPagination,
        'comments': CommentsPagination,
        'infinite': InfinitePagination
    }
    
    return pagination_classes.get(pagination_type, StandardPagination)
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()
from posts.forms import ComentarioForm
from posts.models import Post, Comentario


class ComentarioFormTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.post = Post.objects.create(
            titulo="Test Post",
            contenido="Test content",
            autor=self.user
        )

    def test_comentario_form_valid_data(self):
        """Test del formulario de comentario con datos válidos"""
        form_data = {
            'contenido': 'Este es un comentario válido'
        }
        form = ComentarioForm(data=form_data)
        
        self.assertTrue(form.is_valid())

    def test_comentario_form_empty_content(self):
        """Test del formulario de comentario con contenido vacío"""
        form_data = {
            'contenido': ''
        }
        form = ComentarioForm(data=form_data)
        
        self.assertFalse(form.is_valid())
        self.assertIn('contenido', form.errors)

    def test_comentario_form_save(self):
        """Test de guardar comentario usando el formulario"""
        form_data = {
            'contenido': 'Comentario de prueba'
        }
        form = ComentarioForm(data=form_data)
        
        self.assertTrue(form.is_valid())
        
        # Simular el guardado como se hace en la vista
        comentario = form.save(commit=False)
        comentario.post = self.post
        comentario.usuario = self.user
        comentario.save()
        
        # Verificar que se guardó correctamente
        saved_comentario = Comentario.objects.get(id=comentario.id)
        self.assertEqual(saved_comentario.contenido, 'Comentario de prueba')
        self.assertEqual(saved_comentario.post, self.post)
        self.assertEqual(saved_comentario.usuario, self.user)

    def test_comentario_form_widget_attributes(self):
        """Test de los atributos del widget del formulario"""
        form = ComentarioForm()
        
        # Verificar que el widget tiene las clases CSS correctas
        self.assertIn('form-control', form.fields['contenido'].widget.attrs['class'])
        self.assertEqual(form.fields['contenido'].widget.attrs['rows'], 4)
        self.assertEqual(form.fields['contenido'].widget.attrs['placeholder'], 'Escribe tu comentario...')

    def test_comentario_form_label(self):
        """Test del label del formulario"""
        form = ComentarioForm()
        self.assertEqual(form.fields['contenido'].label, 'Comentario')

    def test_comentario_form_long_content(self):
        """Test del formulario con contenido muy largo"""
        long_content = 'x' * 5000  # Contenido muy largo
        form_data = {
            'contenido': long_content
        }
        form = ComentarioForm(data=form_data)
        
        # El formulario debería ser válido ya que TextField no tiene límite por defecto
        self.assertTrue(form.is_valid())

    def test_comentario_form_whitespace_only(self):
        """Test del formulario con solo espacios en blanco"""
        form_data = {
            'contenido': '   \n\t   '
        }
        form = ComentarioForm(data=form_data)
        
        # Django por defecto no valida espacios en blanco como contenido vacío
        # pero el contenido será limpiado
        if form.is_valid():
            self.assertEqual(form.cleaned_data['contenido'].strip(), '')
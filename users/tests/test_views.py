from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.contrib.messages import get_messages


class UserAuthenticationTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_register_view_get(self):
        """Test de la vista de registro (GET)"""
        url = reverse('users:register')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Crear Cuenta')
        self.assertContains(response, 'form')

    def test_register_view_post_valid(self):
        """Test de registro con datos válidos"""
        url = reverse('users:register')
        response = self.client.post(url, {
            'username': 'newuser',
            'password1': 'complexpass123',
            'password2': 'complexpass123'
        })
        
        # Debería redirigir al login después del registro exitoso
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('users:login'))
        
        # Verificar que el usuario se creó
        user_exists = User.objects.filter(username='newuser').exists()
        self.assertTrue(user_exists)

    def test_register_view_post_invalid(self):
        """Test de registro con datos inválidos"""
        url = reverse('users:register')
        response = self.client.post(url, {
            'username': 'newuser',
            'password1': 'pass',
            'password2': 'different'
        })
        
        # No debería redirigir, debería mostrar errores
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'form')
        
        # Verificar que el usuario no se creó
        user_exists = User.objects.filter(username='newuser').exists()
        self.assertFalse(user_exists)

    def test_register_existing_username(self):
        """Test de registro con username existente"""
        url = reverse('users:register')
        response = self.client.post(url, {
            'username': 'testuser',  # Usuario ya existe
            'password1': 'complexpass123',
            'password2': 'complexpass123'
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'form')

    def test_login_view_get(self):
        """Test de la vista de login (GET)"""
        url = reverse('users:login')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Iniciar Sesión')
        self.assertContains(response, 'form')

    def test_login_view_post_valid(self):
        """Test de login con credenciales válidas"""
        url = reverse('users:login')
        response = self.client.post(url, {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        # Debería redirigir después del login exitoso
        self.assertEqual(response.status_code, 302)
        
        # Verificar que el usuario está autenticado
        user = response.wsgi_request.user
        self.assertTrue(user.is_authenticated)

    def test_login_view_post_invalid(self):
        """Test de login con credenciales inválidas"""
        url = reverse('users:login')
        response = self.client.post(url, {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        
        # No debería redirigir
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'form')

    def test_logout_view(self):
        """Test de la vista de logout"""
        # Primero hacer login
        self.client.login(username='testuser', password='testpass123')
        
        url = reverse('users:logout')
        response = self.client.post(url)  # POST en lugar de GET
        
        # Debería redirigir después del logout
        self.assertEqual(response.status_code, 302)

    def test_login_redirect_authenticated_user(self):
        """Test que usuario autenticado es redirigido desde login"""
        self.client.login(username='testuser', password='testpass123')
        
        url = reverse('users:login')
        response = self.client.get(url)
        
        # Debería redirigir al usuario ya autenticado
        self.assertEqual(response.status_code, 302)


class PasswordResetTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_password_reset_view_get(self):
        """Test de la vista de password reset (GET)"""
        url = reverse('users:password_reset')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Restablecer Contraseña')
        self.assertContains(response, 'form')

    def test_password_reset_view_post(self):
        """Test de solicitud de password reset"""
        url = reverse('users:password_reset')
        response = self.client.post(url, {
            'email': 'test@example.com'
        })
        
        # Debería redirigir a la página de confirmación
        self.assertEqual(response.status_code, 302)
        # Verificar que redirige a alguna URL (sin verificar la específica)
        self.assertTrue(response.url)

    def test_password_reset_done_view(self):
        """Test de la vista de confirmación de password reset"""
        url = reverse('users:password_reset_done')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Correo enviado')

    def test_password_reset_complete_view(self):
        """Test de la vista de password reset completado"""
        url = reverse('users:password_reset_complete')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Contraseña Restablecida')


class UserMessagesTest(TestCase):
    """Test de mensajes de usuario en las vistas"""
    
    def setUp(self):
        self.client = Client()

    def test_register_success_message(self):
        """Test del mensaje de éxito en registro"""
        url = reverse('users:register')
        response = self.client.post(url, {
            'username': 'newuser',
            'password1': 'complexpass123',
            'password2': 'complexpass123'
        }, follow=True)
        
        messages = list(get_messages(response.wsgi_request))
        self.assertTrue(any('Cuenta creada' in str(message) for message in messages))

    def test_login_success_message(self):
        """Test del mensaje de éxito en login"""
        # Crear usuario primero
        User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        url = reverse('users:login')
        response = self.client.post(url, {
            'username': 'testuser',
            'password': 'testpass123'
        }, follow=True)
        
        messages = list(get_messages(response.wsgi_request))
        self.assertTrue(any('Bienvenido' in str(message) for message in messages))

    def test_logout_message(self):
        """Test del mensaje en logout"""
        # Crear y autenticar usuario
        user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
        
        url = reverse('users:logout')
        response = self.client.get(url, follow=True)
        
        messages = list(get_messages(response.wsgi_request))
        self.assertTrue(any('cerrado sesión' in str(message) for message in messages))
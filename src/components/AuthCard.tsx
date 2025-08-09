import { useState, useEffect } from 'react';
import { InputField } from './InputField';
import { Button } from './Button';
import { ToggleSwitch } from './ToggleSwitch';
import { UserIcon, LockIcon, MailIcon, PhoneIcon, ArrowLeftIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../service/auth';
import { AlertSnackbar } from './AlertSnackbar';

export const AuthCard = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
  });

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const [products, setProducts] = useState<{ productId: number; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!isLogin && !isForgotPassword) {
      fetch('http://localhost:8081/products')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setProducts(data);
            if (data.length > 0) setSelectedProductId(data[0].productId);
          }
        })
        .catch((err) => console.error('Failed to load products:', err));
    }
  }, [isLogin, isForgotPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (!isLogin && !isForgotPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match!');
        setAlertType('error');
        setAlertOpen(true);
        return;
      }
      if (!formData.telephone) {
        setError('All fields are required');
        setAlertType('error');
        setAlertOpen(true);
        return;
      }
    }

    if (isForgotPassword) {
      // Handle forgot password
      try {
        if (!forgotPasswordEmail) {
          setError('Please enter your email address');
          setAlertType('error');
          setAlertOpen(true);
          return;
        }

        // Call the forgot password API endpoint
        const response = await fetch(`http://localhost:8081/user/send?email=${encodeURIComponent(forgotPasswordEmail)}`, {
          method: 'POST',
        });

        if (response.ok) {
          setError('Password reset instructions have been sent to your email address.');
          setAlertType('success');
          setAlertOpen(true);
          
          // Reset and go back to login
          setForgotPasswordEmail('');
          setIsForgotPassword(false);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || 'Failed to send reset email. Please try again.');
          setAlertType('error');
          setAlertOpen(true);
        }
        return;
      } catch (error: any) {
        console.error('Forgot password error:', error);
        setError('Failed to send reset email. Please check your connection and try again.');
        setAlertType('error');
        setAlertOpen(true);
        return;
      }
    }

    const url = isLogin
        ? '/user/login'
        : '/user/register';

    try {
      let data;
      if (isLogin) {
        data = await login({ email: formData.email, password: formData.password });
      } else {
        data = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          telephone: formData.telephone,
          userName: formData.email.split('@')[0],
          role: 'USER',
          productId: selectedProductId,
        });
      }

      if (isLogin) {
        const token = (data as { token: string }).token;
        localStorage.setItem('token', token);

        // Fetch user info to get product ID
        try {
          const response = await fetch('http://localhost:8081/user/get_user_info_by_token', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userInfo = await response.json();
            if (userInfo.productId) {
              localStorage.setItem('productId', userInfo.productId);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }

        navigate('/dashboard');
      } else {
        setError('Registered successfully. Please log in.');
        setAlertType('success');
        setAlertOpen(true);
        setIsLogin(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          telephone: '',
        });
      }
    } catch (error: any) {
      console.error('API Error:', error);
      setError('Wrong UserName Or Password..!');
      setAlertType('error');
      setAlertOpen(true);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setForgotPasswordEmail('');
    setError('');
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setError('');
  };

  // Forgot Password Form
  if (isForgotPassword) {
    return (
      <div className="w-full max-w-md transition-all duration-500 ease-in-out">
        <AlertSnackbar message={error} type={alertType} open={alertOpen} onClose={() => setAlertOpen(false)} />
        <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-2xl shadow-lg p-8 transition-all duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Forgot Password</h1>
            <p className="text-gray-600 mt-2">
              Enter your email address to receive password reset instructions
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <InputField
              id="forgotEmail"
              type="email"
              label="Email Address"
              icon={<MailIcon size={18} className="text-gray-400" />}
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
            />

            <Button type="submit">
              Send Reset Instructions
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="flex items-center justify-center w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon size={16} className="mr-2" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="w-full max-w-md transition-all duration-500 ease-in-out">
        <AlertSnackbar message={error} type={alertType} open={alertOpen} onClose={() => setAlertOpen(false)} />
        <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-2xl shadow-lg p-8 transition-all duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isLogin
                  ? 'Sign in to access your account'
                  : 'Sign up to get started with our service'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
                <>
                  <InputField
                      id="name"
                      type="text"
                      label="Full Name"
                      icon={<UserIcon size={18} className="text-gray-400" />}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />

                  <InputField
                      id="telephone"
                      type="tel"
                      label="Telephone"
                      icon={<PhoneIcon size={18} className="text-gray-400" />}
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />

                  <div>
                    <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <select
                      id="product"
                      className="mb-1 block w-full border-gray-300 rounded-md backdrop-filter backdrop-blur-lg rounded-2xl shadow-lg p-1 transition-all duration-500"
                      value={selectedProductId || ''}
                      onChange={e => setSelectedProductId(Number(e.target.value))}
                      required
                    >
                      {products.map(product => (
                        <option key={product.productId} value={product.productId}>{product.name}</option>
                      ))}
                    </select>
                  </div>
                </>
            )}

            <InputField
                id="email"
                type="email"
                label="Email Address"
                icon={<MailIcon size={18} className="text-gray-400" />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <InputField
                id="password"
                type="password"
                label="Password"
                icon={<LockIcon size={18} className="text-gray-400" />}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            {!isLogin && (
                <InputField
                    id="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    icon={<LockIcon size={18} className="text-gray-400" />}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
            )}

            <Button type="submit">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <div className="text-sm text-gray-600 mb-4">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </div>
            <ToggleSwitch
                isLogin={isLogin}
                onToggle={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
            />
          </div>
        </div>
      </div>
  );
};
import { useState } from 'react';
import { InputField } from './InputField';
import { Button } from './Button';
import { ToggleSwitch } from './ToggleSwitch';
import { UserIcon, LockIcon, MailIcon, PhoneIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../service/auth';
import { AlertSnackbar } from './AlertSnackbar';

export const AuthCard = () => {
  const [isLogin, setIsLogin] = useState(true);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!formData.telephone) {
        setError('All fields are required');
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
        });
      }

      if (isLogin) {
        localStorage.setItem('token', (data as { token: string }).token);
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
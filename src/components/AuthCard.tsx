import { useState } from 'react';
import { InputField } from './InputField';
import { Button } from './Button';
import { ToggleSwitch } from './ToggleSwitch';
import { UserIcon, LockIcon, MailIcon, PhoneIcon, HomeIcon, CreditCardIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AuthCard = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
  });

  const handleSubmit = async (e) => {
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

    const BASE_URL = 'http://ec2-13-203-77-193.ap-south-1.compute.amazonaws.com:8080';
    const url = isLogin
        ? `${BASE_URL}/user/login`
        : `${BASE_URL}/user/register`;

    try {
      const payload = isLogin
          ? { email: formData.email, password: formData.password }
          : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            telephone: formData.telephone,
            userName: formData.email.split('@')[0], // Generate username from email
            role: 'USER' // Correct role value from Postman
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          navigate('/dashboard');
        } else {
          alert('Registered successfully. Please log in.');
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
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('API Error:', error);
      setError('Server is unavailable. Please try again later.');
    }
  };

  return (
      <div className="w-full max-w-md transition-all duration-500 ease-in-out">
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

          {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
          )}

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
                      required
                  />

                  <InputField
                      id="telephone"
                      type="tel"
                      label="Telephone"
                      icon={<PhoneIcon size={18} className="text-gray-400" />}
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      pattern="[0-9]{10}"
                      title="10-digit phone number"
                      required
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
                required
            />

            <InputField
                id="password"
                type="password"
                label="Password"
                icon={<LockIcon size={18} className="text-gray-400" />}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
            />

            {!isLogin && (
                <InputField
                    id="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    icon={<LockIcon size={18} className="text-gray-400" />}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                />
            )}

            <Button type="submit" className="w-full">
              {isLogin ? 'Sign In' : 'Create Account'}
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
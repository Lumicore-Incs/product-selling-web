import { useState } from 'react';
import { InputField } from './InputField';
import { Button } from './Button';
import { ToggleSwitch } from './ToggleSwitch';
import { UserIcon, LockIcon, MailIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AuthCard = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('sample1');
  const navigate = useNavigate();

   const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };
  
  return (
    <div className="w-full max-w-md transition-all duration-500 ease-in-out">
      <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-2xl shadow-lg p-8 transition-all duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Sign in to access your account' : 'Sign up to get started with our service'}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <InputField 
                id="name" 
                type="text" 
                label="Full Name" 
                icon={<UserIcon size={18} className="text-gray-400" />} 
              />
              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="sample1">Sample 1</option>
                  <option value="sample2">Sample 2</option>
                </select>
              </div>
            </>
          )}
          <InputField 
            id="email" 
            type="email" 
            label="Email Address" 
            icon={<MailIcon size={18} className="text-gray-400" />} 
          />
          <InputField 
            id="password" 
            type="password" 
            label="Password" 
            icon={<LockIcon size={18} className="text-gray-400" />} 
          />
          {!isLogin && (
            <InputField 
              id="confirmPassword" 
              type="password" 
              label="Confirm Password" 
              icon={<LockIcon size={18} className="text-gray-400" />} 
            />
          )}
          <Button>{isLogin ? 'Sign In' : 'Create Account'}</Button>
        </form>
        <div className="mt-8 text-center">
          <div className="text-sm text-gray-600 mb-4">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </div>
          <ToggleSwitch isLogin={isLogin} onToggle={() => setIsLogin(!isLogin)} />
        </div>
      </div>
    </div>
  );
};
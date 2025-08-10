import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { ArrowLeftIcon, LockIcon } from 'lucide-react';
import { AlertSnackbar } from './AlertSnackbar';
import axios from '../service/axiosConfig';

interface OtpVerificationProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const OtpVerification = ({ email, onBack, onSuccess }: OtpVerificationProps) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0] && !showPasswordReset) {
      inputRefs.current[0].focus();
    }
  }, [showPasswordReset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (showPasswordReset) {
      // Handle password reset submission
      if (password !== confirmPassword) {
        setError('Passwords do not match!');
        setAlertType('error');
        setAlertOpen(true);
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setAlertType('error');
        setAlertOpen(true);
        setIsLoading(false);
        return;
      }

      try {
        const otpValue = otp.join('');
        const response = await axios.post('/user/reset', {
          email,
          otp: otpValue,
          password
        });

        if (response.status === 200) {
          setError('Password reset successfully!');
          setAlertType('success');
          setAlertOpen(true);
          onSuccess();
        }
      } catch (error: any) {
        console.error('Password reset error:', error);
        setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
        setAlertType('error');
        setAlertOpen(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle OTP verification
      const otpValue = otp.join('');
      if (otpValue.length !== 4) {
        setError('Please enter a valid 4-digit OTP');
        setAlertType('error');
        setAlertOpen(true);
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          `/user/validate?email=${encodeURIComponent(email)}&otp=${otpValue}`
        );

        if (response.status === 200) {
          setShowPasswordReset(true);
        } else {
          const errorData = response.data;
          setError(errorData.message || 'Invalid OTP. Please try again.');
          setAlertType('error');
          setAlertOpen(true);
        }
      } catch (error: any) {
        console.error('OTP verification error:', error);
        setError(error.response?.data?.message || 'Failed to verify OTP. Please check your connection and try again.');
        setAlertType('error');
        setAlertOpen(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ... (keep the existing handleOtpChange and handlePaste functions)
  
  const handleOtpChange = (index: number, value: string) => {
    if (/^\d*$/.test(value)) { // Only allow numbers
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus to next input
      if (value && index < 3) {
        const nextInput = inputRefs.current[index + 1];
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{4}$/.test(pasteData)) {
      const otpArray = pasteData.split('');
      const newOtp = [...otp];
      
      otpArray.slice(0, 4).forEach((digit, index) => {
        if (index < 4) {
          newOtp[index] = digit;
        }
      });

      setOtp(newOtp);
      
      // Focus the last input after paste
      const lastInput = inputRefs.current[Math.min(3, otpArray.length - 1)];
      if (lastInput) lastInput.focus();
    }
  };

  return (
    <div className="w-full max-w-md transition-all duration-500 ease-in-out" onPaste={!showPasswordReset ? handlePaste : undefined}>
      <AlertSnackbar message={error} type={alertType} open={alertOpen} onClose={() => setAlertOpen(false)} />
      <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-2xl shadow-lg p-8 transition-all duration-500">
        {showPasswordReset ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
              <p className="text-gray-600 mt-2">
                Please enter your new password
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <LockIcon size={18} className="absolute left-4 top-3.5 text-gray-400" />
              </div>

              <div className="relative">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <LockIcon size={18} className="absolute left-4 top-3.5 text-gray-400" />
              </div>

              <Button type="submit">
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Verify OTP</h1>
              <p className="text-gray-600 mt-2">
                We've sent a 4-digit code to <span className="font-semibold">{email}</span>
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex justify-center space-x-4">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="w-16 h-16 text-3xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={otp[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[index] && index > 0) {
                        const prevInput = inputRefs.current[index - 1];
                        if (prevInput) prevInput.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <Button type="submit">
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon size={16} className="mr-2" />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
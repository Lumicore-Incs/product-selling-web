import React, { useEffect, useState } from 'react';
import { getCurrentUser, updateUser } from '../service/auth';
import { Camera, User, Lock, LogOut, Check, CheckCircle, Eye, EyeOff, Key, X } from 'lucide-react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { useNavigate } from 'react-router-dom';

interface UserData {
  id: string;
  name: string;
  email: string;
  telephone: string;
  role: string;
  registration_date: string;
  status: string;
  type: string;
  address?: string;
  nic?: string;
  userName?: string;
}

// Password Strength Indicator Component
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);
  const width = `${(strength / 5) * 100}%`;

  const getColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getText = () => {
    if (password.length === 0) return '';
    if (strength <= 1) return 'Very Weak';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">Password Strength:</span>
        <span className={`font-medium ${
          strength <= 1 ? 'text-red-600' :
          strength <= 3 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {getText()}
        </span>
      </div>
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width }}
        />
      </div>
      {password.length > 0 && (
        <ul className="mt-2 text-xs text-gray-500 space-y-1">
          <li className={`flex items-center ${password.length >= 8 ? 'text-green-600' : ''}`}>
            <CheckCircle className={`w-3 h-3 mr-1 ${password.length >= 8 ? 'text-green-600' : 'text-gray-300'}`} />
            At least 8 characters
          </li>
          <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
            <CheckCircle className={`w-3 h-3 mr-1 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-300'}`} />
            Uppercase letter
          </li>
          <li className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
            <CheckCircle className={`w-3 h-3 mr-1 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-300'}`} />
            Number
          </li>
        </ul>
      )}
    </div>
  );
};

// Password Change Dialog Component
const PasswordChangeDialog = ({
  open,
  onClose,
  userId,
  userName,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess: (message: string) => void;
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Validation
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // In a real application, you would call an API to change the password
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call your actual API here:
      // await userService.changePassword(userId, currentPassword, newPassword);
      
      onSuccess('Password changed successfully!');
      handleClose();
    } catch (err) {
      setError('Failed to change password. Please check your current password.');
      console.error('Password change error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                <p className="text-sm text-gray-500">For user: {userName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Password Requirements */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-2 text-gray-400" />
                  Minimum 8 characters
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-2 text-gray-400" />
                  At least one uppercase letter
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-2 text-gray-400" />
                  At least one number
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-2 text-gray-400" />
                  Special character (optional but recommended)
                </li>
              </ul>
            </div>
          </div>

          {/* Dialog Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                isLoading || !currentPassword || !newPassword || newPassword !== confirmPassword
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Changing...
                </span>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });
  const [passwordChangeDialog, setPasswordChangeDialog] = useState(false);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear();
    // Redirect to login page
    navigate('/login');
  };
  const [formData, setFormData] = useState<UserData>({
    id: '',
    name: '',
    email: '',
    telephone: '',
    role: '',
    registration_date: '',
    status: '',
    type: '',
    address: '',
    nic: '',
    userName: ''
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getCurrentUser();
        const userData: UserData = {
        id: String(data.id) || '',
        name: data.name || '',
        email: data.email || '',
        telephone: data.telephone || '',
        role: data.role || '',
        registration_date: (data as any).registration_date || '',
        status: (data as any).status || 'active',
        type: (data as any).type || 'user',
        address: (data as any).address || '',
        nic: (data as any).nic || '',
        userName: (data as any).userName || ''
      };
        setUser(userData);
        setFormData(userData);
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Call backend to update user
    const doSave = async () => {
      setSaving(true);
      try {
        const payload = {
          name: formData.name,
          address: formData.address || '',
          email: formData.email,
          telephone: formData.telephone,
          role: formData.role || 'USER',
          nic: formData.nic || '',
          userName: formData.userName || ''
        };

        const resp = await updateUser(formData.id, payload);
        // Update local state with returned data if available
        if (resp) {
          const updated = {
            ...formData,
            name: resp.name || formData.name,
            email: resp.email || formData.email,
            telephone: resp.telephone || formData.telephone,
            role: resp.role || formData.role,
            address: (resp as any).address || formData.address,
            nic: (resp as any).nic || formData.nic,
            userName: (resp as any).userName || formData.userName,
          };
          setUser(updated);
          setFormData(updated);
        }
        setIsEditing(false);
        setSnackbar({ open: true, message: 'Profile updated successfully', type: 'success' });
      } catch (err: any) {
        console.error('Update failed:', err);
        const msg = err?.response?.data || err?.message || 'Failed to update profile';
        setSnackbar({ open: true, message: String(msg), type: 'error' });
      } finally {
        setSaving(false);
      }
    };

    doSave();
  };

  const handleDiscard = () => {
    if (user) {
      setFormData({ ...user });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-red-500">Unable to load user profile.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
      <PasswordChangeDialog
        open={passwordChangeDialog}
        onClose={() => setPasswordChangeDialog(false)}
        userId={user?.id || ''}
        userName={user?.name || ''}
        onSuccess={(message) => setSnackbar({ open: true, message, type: 'success' })}
      />
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Left Profile Card */}
            <div className="w-full lg:w-80">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 overflow-hidden">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23d1d5db'/%3E%3C/svg%3E" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition">
                    <Camera size={16} className="text-white" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{formData.name}</h2>
                <p className="text-sm text-gray-500 mb-6">{formData.role || 'User'}</p>

                <div className="w-full space-y-2">
                  <button className="w-full flex items-center gap-3 px-6 py-3 bg-orange-100 text-gray-800 rounded-xl hover:bg-orange-200 transition">
                    <User size={18} />
                    <span className="text-sm font-medium">Personal Information</span>
                  </button>
                  <button 
                    onClick={() => setPasswordChangeDialog(true)}
                    className="w-full flex items-center gap-3 px-6 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition"
                  >
                    <Lock size={18} />
                    <span className="text-sm font-medium">Change Password</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-6 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Log Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Personal Information</h3>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Telephone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600">
                      <Check size={16} />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Registration Date</label>
                  <input
                    type="text"
                    name="registration_date"
                    value={formData.registration_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Status</label>
                    <input
                      type="text"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Type</label>
                    <input
                      type="text"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition"
                  >
                    Update
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleDiscard();
                        setIsEditing(false);
                      }}
                      className="w-full px-6 py-3 border-2 border-orange-500 text-orange-500 rounded-xl font-medium hover:bg-orange-50 transition"
                    >
                      Discard Changes
                    </button>
                    <button
                      onClick={() => handleSave()}
                      disabled={saving}
                      className={`w-full px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
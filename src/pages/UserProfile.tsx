import React, { useEffect, useState } from 'react';
import { getCurrentUser, updateUser } from '../service/auth';
import { Camera, User, Lock, LogOut, Check } from 'lucide-react';
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

export const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });

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
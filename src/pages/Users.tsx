import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  EyeOff,
  Key,
  Lock,
  Mail,
  Package,
  Phone,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { InputField } from '../components/InputField';
import { productApi } from '../services/api';
import { userService } from '../services/users/userService';

type User = ServiceUser & { productName?: string };

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


// Password Reset Dialog Component (for admin)
const PasswordResetDialog = ({
  open,
  onClose,
  userId,
  userName,
  onResetPassword,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onResetPassword: (userId: string, password: string) => Promise<void>;
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordGenerated, setPasswordGenerated] = useState(false);

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
    setPasswordGenerated(true);
  };

  const handleSubmit = async () => {
    if (!newPassword) {
      setError('Password is required');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call the password reset function passed from parent
      await onResetPassword(userId, newPassword);
      handleClose();
    } catch (err) {
      setError('Failed to reset password. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setPasswordGenerated(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Key className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Reset Password</h3>
                <p className="text-sm text-gray-500">Admin action for: {userName}</p>
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Note:</span> This will immediately change the user's password.
                The new password should be shared securely with the user.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={generatePassword}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                <Key className="w-4 h-4" />
                Generate Secure Password
              </button>
              {passwordGenerated && (
                <span className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Password generated
                </span>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Confirm new password"
                />
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
              disabled={isLoading || !newPassword || newPassword !== confirmPassword}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                isLoading || !newPassword || newPassword !== confirmPassword
                  ? 'bg-red-300 text-white cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState<{ productId: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [passwordResetDialog, setPasswordResetDialog] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: '',
  });

  const [newUser, setNewUser] = useState<User>({
    id: Date.now().toString(),
    email: '',
    name: '',
    registration_date: new Date().toISOString().split('T')[0],
    role: 'User',
    type: '',
    status: 'pending',
    contact: '',
    productId: 0,
    productName: '',
    password: '',
    serialPrefix: '',
  });

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.role.toLowerCase().includes(searchTermLower) ||
      user.contact.toLowerCase().includes(searchTermLower) ||
      (user.serialPrefix || '').toLowerCase().includes(searchTermLower)
    );
  });

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Handle user deletion
  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const performDelete = async (id: string | null) => {
    if (!id) return;
    try {
      await userService.deleteUser(id);
      setUsers(users.filter((user) => user.id !== id));
      showToast('User deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete user:', error);
      showToast('Failed to delete user. Please try again.', 'error');
    } finally {
      setPendingDeleteId(null);
    }
  };

  // Handle user editing
  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    toast[type](message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      try {
        const updatedUser = await userService.updateUser(editingUser.id, {
          name: editingUser.name,
          email: editingUser.email,
          contact: editingUser.contact,
          role: editingUser.role,
          status: editingUser.status,
          serialPrefix: editingUser.serialPrefix,
          password: null as any, // Don't update password when editing user
        });

        setUsers(
          users.map((user) =>
            user.id === updatedUser.id
              ? {
                ...updatedUser,
              }
              : user
          )
        );
        setEditingUser(null);
        showToast('User updated successfully!', 'success');
      } catch (error) {
        console.error('Failed to update user:', error);
        showToast('Failed to update user. Please try again.', 'error');
      }
    }
  };

  // Handle password reset
  const handleResetPassword = async (userId: string, password: string) => {
    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate) {
      throw new Error('User not found');
    }

    try {
      const updatedUser = await userService.updateUser(userId, {
        name: userToUpdate.name,
        email: userToUpdate.email,
        contact: userToUpdate.contact,
        role: userToUpdate.role,
        status: userToUpdate.status,
        password: password, // Send the new password from text field
      });

      setUsers(
        users.map((user) =>
          user.id === updatedUser.id ? { ...user, ...updatedUser } : user
        )
      );
      showToast(`Password reset successfully for ${userToUpdate.name}`, 'success');
    } catch (error) {
      console.error('Failed to reset password:', error);
      showToast('Failed to reset password. Please try again.', 'error');
      throw error;
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  // Handle add new user
  const handleAddUser = async () => {
    setIsLoading(true);
    try {
      await userService.createUser(newUser);
      const latest = await userService.getAllUsers();
      setUsers(latest);
      showToast('User added successfully!', 'success');
    } catch (err) {
      console.error('Failed to create user:', err);
      showToast('Failed to create user. Please try again.', 'error');
      return;
    } finally {
      setIsLoading(false);
      setNewUser({
        id: Date.now().toString(),
        email: '',
        name: '',
        registration_date: new Date().toISOString().split('T')[0],
        role: 'User',
        type: 'USER',
        status: 'pending',
        contact: '',
        productId: 0,
        productName: '',
        password: '',
        serialPrefix: '',
      });
      setShowAddForm(false);
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> };
      case 'inactive':
        return { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-4 h-4" /> };
    }
  };

  // Fetch users and products from API on mount
  useEffect(() => {
    Promise.all([userService.getAllUsers(), productApi.getAllProducts()])
      .then(([usersData, productsData]) => {
        setUsers(usersData);
        setProducts(productsData.map((p) => ({ productId: p.productId || 0, name: p.name })));
      })
      .catch((err) => console.error('Failed to fetch data', err));
  }, []);

  return (
    <div className="space-y-6 mx-6 relative">
      <BackgroundIcons type="users" />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete user"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          performDelete(pendingDeleteId);
        }}
        onCancel={() => {
          setPendingDeleteId(null);
        }}
      />
      <PasswordResetDialog
        open={passwordResetDialog.open}
        onClose={() => setPasswordResetDialog({ open: false, userId: '', userName: '' })}
        userId={passwordResetDialog.userId}
        userName={passwordResetDialog.userName}
        onResetPassword={handleResetPassword}
      />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transform transition-all duration-300 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by name, email, role, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Add New User</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="tel"
              placeholder="Contact"
              value={newUser.contact}
              onChange={(e) => setNewUser({ ...newUser, contact: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="USER">USER</option>
              <option value="SUPER USER">SUPER USER</option>
            </select>
            <select
              value={newUser.status}
              onChange={(e) => setNewUser({ ...newUser, status: e.target.value as User['status'] })}
              className="px-3 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <input
              type="text"
              placeholder="Serial Prefix"
              value={newUser.serialPrefix || ''}
              onChange={(e) => setNewUser({ ...newUser, serialPrefix: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <InputField
              id="password"
              type="password"
              label="Password"
              icon={<Lock size={18} className="text-gray-400" />}
              value={newUser.password ?? ''}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              inputProps={{ placeholder: 'Password' }}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                const firstProduct = products[0];
                setNewUser((prev) => ({
                  ...prev,
                  name: 'Sample User',
                  email: `sample${Date.now() % 1000}@example.com`,
                  contact: '0123456789',
                  password: 'TempPass123!',
                  role: 'User',
                  type: '',
                  status: 'pending',
                  serialPrefix: 'SAMPLE',
                }));
              }}
              disabled={isLoading}
              className="bg-yellow-400 text-white px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Fill Sample
            </button>
            <button
              onClick={handleAddUser}
              disabled={isLoading}
              aria-busy={isLoading}
              className={`px-4 py-2 rounded-lg transition-colors ${isLoading
                  ? 'bg-green-300 text-white cursor-wait'
                  : 'bg-green-500 text-white hover:bg-green-600'
                }`}
            >
              {isLoading ? 'Adding…' : 'Add User'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table - Desktop View */}
      <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl shadow-sm hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Name
                  </div>
                </th>
                <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </th>
                <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact
                  </div>
                </th>
                <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Role
                  </div>
                </th>
                <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-[8%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serial Prefix
                </th>
                <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </div>
                </th>
                <th className="w-[11%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-300">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, email: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <input
                          type="tel"
                          value={editingUser.contact}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, contact: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-500 truncate">{user.contact}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <option value="USER">USER</option>
                          <option value="SUPER USER">SUPER USER</option>
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500 truncate">{user.role}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.status}
                          onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusDisplay(user.status).color
                              }`}
                          >
                            {user.status}
                          </span>
                          {getStatusDisplay(user.status).icon}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.serialPrefix || ''}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, serialPrefix: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-500 truncate">{user.serialPrefix || '-'}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(user.registration_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {editingUser?.id === user.id ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-900"
                            title="Save"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                            title="Cancel"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => setPasswordResetDialog({
                              open: true,
                              userId: user.id,
                              userName: user.name,
                            })}
                            className="text-purple-600 hover:text-purple-900 group relative"
                            title="Reset Password (Admin)"
                          >
                            <Key className="w-5 h-5" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Reset Password
                            </span>
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-yellow-600 hover:text-yellow-900 group relative"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900 group relative"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Delete
                            </span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-gray-500">
              Showing {paginatedUsers.length} of {filteredUsers.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Prev
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Card View - Mobile View */}
      <div className="md:hidden space-y-4">
        {paginatedUsers.length > 0 ? (
          paginatedUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl shadow-sm p-4 border border-gray-200"
            >
              {/* User Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {editingUser?.id === user.id ? (
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 font-semibold text-gray-900"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-500" />
                      {user.name}
                    </h3>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {editingUser?.id === user.id ? (
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })}
                      className="px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs font-medium"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  ) : (
                    <>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(user.status).color
                          }`}
                      >
                        {user.status}
                      </span>
                      {getStatusDisplay(user.status).icon}
                    </>
                  )}
                </div>
              </div>

              {/* User Card Body */}
              <div className="space-y-3 mb-4">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                    {editingUser?.id === user.id ? (
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, email: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm text-gray-700"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 truncate">{user.email}</p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Contact</p>
                    {editingUser?.id === user.id ? (
                      <input
                        type="tel"
                        value={editingUser.contact}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, contact: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm text-gray-700"
                      />
                    ) : (
                      <p className="text-sm text-gray-700">{user.contact}</p>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Role</p>
                    {editingUser?.id === user.id ? (
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                      >
                        <option value="USER">USER</option>
                        <option value="SUPER USER">SUPER USER</option>
                      </select>
                    ) : (
                      <p className="text-sm text-gray-700">{user.role}</p>
                    )}
                  </div>
                </div>

                {/* Serial Prefix */}
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Serial Prefix</p>
                    {editingUser?.id === user.id ? (
                      <input
                        type="text"
                        value={editingUser.serialPrefix || ''}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, serialPrefix: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm text-gray-700"
                      />
                    ) : (
                      <p className="text-sm text-gray-700">{user.serialPrefix || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Registration Date</p>
                    <p className="text-sm text-gray-700">
                      {new Date(user.registration_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {editingUser?.id === user.id ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setPasswordResetDialog({
                        open: true,
                        userId: user.id,
                        userName: user.name,
                      })}
                      className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                      Reset
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl shadow-sm p-6 text-center text-gray-500">
            No users found
          </div>
        )}

        {/* Mobile Pagination */}
        <div className="flex flex-col gap-3 items-center pt-2">
          <p className="text-sm text-gray-500">
            Showing {paginatedUsers.length} of {filteredUsers.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border text-sm ${currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded border text-sm ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
import {
  CheckCircle,
  Edit,
  Eye,
  EyeOff,
  Key,
  Lock,
  Package,
  Save,
  Search,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { InputField } from '../components/InputField';
import { userService, type User as ServiceUser } from '../services/users/userService';
import { productApi } from '../services/api';

type User = ServiceUser & { productName?: string };

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
              {/* inline strength bar */}
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(newPassword.length / 12 * 100, 100)}%`, background: newPassword.length < 6 ? '#EF4444' : newPassword.length < 10 ? '#F59E0B' : '#10B981' }} />
                  </div>
                </div>
              )}
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
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editShortName, setEditShortName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
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
    const matchingProduct = products.find(p => p.serialPrefix === user.serialPrefix);
    setEditShortName(matchingProduct?.shortName || '');
    setEditPrice(matchingProduct?.price ? matchingProduct.price.toString() : '');
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

        // Update or create product if serial prefix is provided
        if (editingUser.serialPrefix) {
          const matchingProduct = products.find(p => p.serialPrefix === editingUser.serialPrefix);
          if (matchingProduct) {
            const updatedProduct = await productApi.updateProduct(matchingProduct.productId, {
              name: matchingProduct.name || editingUser.name || 'Product',
              shortName: editShortName,
              price: parseFloat(editPrice) || 0,
              serialPrefix: editingUser.serialPrefix,
              status: matchingProduct.status || 'active',
            });
            setProducts(prev => prev.map(p => p.productId === updatedProduct.productId ? updatedProduct : p));
          } else {
            // Create a new product since it does not exist
            const newProduct = await productApi.createProduct({
              name: editingUser.name || 'Product',
              shortName: editShortName,
              price: parseFloat(editPrice) || 0,
              serialPrefix: editingUser.serialPrefix,
              status: 'active',
            });
            setProducts(prev => [...prev, newProduct]);
          }
        }

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
        setEditShortName('');
        setEditPrice('');
        showToast('User and Product details updated successfully!', 'success');
      } catch (error) {
        console.error('Failed to update user/product:', error);
        showToast('Failed to update. Please try again.', 'error');
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
    setEditShortName('');
    setEditPrice('');
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

  // Fetch users and products on mount
  useEffect(() => {
    userService.getAllUsers()
      .then((usersData) => setUsers(usersData))
      .catch((err) => console.error('Failed to fetch users', err));

    productApi.getAllProducts()
      .then((productsData) => setProducts(productsData))
      .catch((err) => console.error('Failed to fetch products', err));
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'transparent',
        minHeight: '1024px',
        minWidth: 0,
        width: '100%',
        padding: '8px 4px 40px',
        boxSizing: 'border-box',
      }}
    >
      {/* Figma background glowing ellipses */}
      <div className="absolute w-[543px] h-[582px] left-[1003px] top-[-137px] bg-[#7100BD] opacity-[0.12] rounded-full pointer-events-none" style={{ filter: 'blur(323.5px)' }} />
      <div className="absolute w-[386px] h-[328px] left-[492px] top-[606px] bg-[#7100BD] opacity-[0.12] rounded-full pointer-events-none" style={{ filter: 'blur(323.5px)' }} />
      <div className="absolute w-[677px] h-[726px] left-[835px] top-[407px] bg-[#0B818D] opacity-[0.12] rounded-full pointer-events-none" style={{ filter: 'blur(323.5px)' }} />
      <div className="absolute w-[677px] h-[726px] left-[-185px] top-[-42px] bg-[#0B818D] opacity-[0.12] rounded-full pointer-events-none" style={{ filter: 'blur(323.5px)' }} />

      <div className="space-y-6 relative z-10">
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
      <div className="p-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-[28px] text-[#0E626E] font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>User Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center bg-[#0B818D] hover:bg-[#096B75] text-white w-[93px] h-[42px] rounded-[10px] transition-colors text-[16px] font-medium font-['Inter'] shadow-sm"
          >
            + Add
          </button>
        </div>

        {/* Search Bar (Mobile Only to match Figma desktop which has no search bar in the table container) */}
        <div className="mb-6 md:hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm bg-white"
              style={{ color: '#5C626E' }}
            />
          </div>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Add New User</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm" />
              <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm" />
              <input type="tel" placeholder="Contact" value={newUser.contact} onChange={(e) => setNewUser({ ...newUser, contact: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm" />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm"><option value="USER">USER</option><option value="SUPER USER">SUPER USER</option></select>
              <select value={newUser.status} onChange={(e) => setNewUser({ ...newUser, status: e.target.value as User['status'] })} className="px-3 h-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm"><option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
              <input type="text" placeholder="Serial Prefix" value={newUser.serialPrefix || ''} onChange={(e) => setNewUser({ ...newUser, serialPrefix: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm" />
              <InputField id="password" type="password" label="Password" icon={<Lock size={16} className="text-gray-400" />} value={newUser.password ?? ''} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} inputProps={{ placeholder: 'Password', className: 'text-sm' }} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setNewUser((prev: ServiceUser & { productName?: string }) => ({ ...prev, name: 'Sample User', email: `sample${Date.now() % 1000}@example.com`, contact: '0123456789', password: 'TempPass123!', role: 'User', type: '', status: 'pending', serialPrefix: 'SAMPLE' })); }} disabled={isLoading} className="bg-yellow-400 text-white px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors text-sm font-medium">Fill Sample</button>
              <button onClick={handleAddUser} disabled={isLoading} className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${isLoading ? 'bg-green-300 text-white cursor-wait' : 'bg-green-500 text-white hover:bg-green-600'}`}>{isLoading ? 'Adding…' : 'Add User'}</button>
              <button onClick={() => setShowAddForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium">Cancel</button>
            </div>
          </div>
        )}

        {/* Users Table - Desktop View */}
        <div className="hidden md:block">
          <div 
            className="overflow-hidden" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.49)', 
              borderRadius: '18px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.7)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.42)' }} className="h-[66px] border-b border-white">
                    <th className="px-6 text-[16px] font-medium text-[#414141] font-['Inter']">Id</th>
                    <th className="px-6 text-[16px] font-medium text-[#414141] font-['Inter']">Name</th>
                    <th className="px-6 text-[16px] font-medium text-[#414141] font-['Inter']">Short Name</th>
                    <th className="px-6 text-[16px] font-medium text-[#414141] font-['Inter']">Serial Prefix</th>
                    <th className="px-6 text-[16px] font-medium text-[#414141] font-['Inter']">Price</th>
                    <th className="px-6 text-[16px] font-medium text-[#414141] font-['Inter']">Status</th>
                    <th className="px-6 text-[16px] font-medium text-[#414141] font-['Inter'] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user, index) => {
                      const matchingProduct = products.find(p => p.serialPrefix === user.serialPrefix);
                      const shortName = matchingProduct?.shortName || user.serialPrefix || '-';
                      const priceVal = matchingProduct?.price ? `LKR ${Number(matchingProduct.price).toFixed(2)}` : '-';
                      
                      return (
                        <tr 
                          key={user.id} 
                          className="hover:bg-white/50 transition-colors h-[60px] border-b border-white"
                          style={{ background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.45)' : 'transparent' }}
                        >
                          <td className="px-6 text-[16px] font-medium text-[#414141] font-['Inter']">{user.id}</td>
                          <td className="px-6">
                            {editingUser?.id === user.id ? (
                              <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-[16px] font-medium text-[#414141] font-['Inter']" />
                            ) : (
                              <span className="text-[16px] font-medium text-[#414141] font-['Inter']">{user.name}</span>
                            )}
                          </td>
                          <td className="px-6">
                            {editingUser?.id === user.id ? (
                              <input type="text" value={editShortName} onChange={(e) => setEditShortName(e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-[16px] font-medium text-[#414141] font-['Inter']" />
                            ) : (
                              <span className="text-[16px] font-medium text-[#414141] font-['Inter']">{shortName}</span>
                            )}
                          </td>
                          <td className="px-6 text-[16px] font-medium text-[#414141] font-['Inter']">
                            {editingUser?.id === user.id ? (
                              <input type="text" value={editingUser.serialPrefix || ''} onChange={(e) => setEditingUser({ ...editingUser, serialPrefix: e.target.value })} className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-[16px] font-medium text-[#414141] font-['Inter']" />
                            ) : (
                              user.serialPrefix || '-'
                            )}
                          </td>
                          <td className="px-6">
                            {editingUser?.id === user.id ? (
                              <input type="text" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-[16px] font-medium text-[#414141] font-['Inter']" />
                            ) : (
                              <span className="text-[16px] font-medium text-[#414141] font-['Inter']">{priceVal}</span>
                            )}
                          </td>
                          <td className="px-6">
                            {editingUser?.id === user.id ? (
                              <select value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })} className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-[16px] font-medium text-[#414141] font-['Inter']"><option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
                            ) : (
                              <span className="inline-flex items-center justify-center px-2 py-[2px] rounded-[17px] font-medium text-[12px] leading-none font-['Inter']" style={{ background: user.status === 'active' ? 'rgba(137, 250, 154, 0.46)' : user.status === 'inactive' ? 'rgba(255, 100, 100, 0.25)' : 'rgba(254, 243, 199, 0.5)', color: user.status === 'active' ? '#016D18' : user.status === 'inactive' ? '#9B0000' : '#92400E' }}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 text-center">
                            {editingUser?.id === user.id ? (
                              <div className="flex gap-3 justify-center items-center h-full">
                                <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800" title="Save"><Save className="w-[20px] h-[20px]" /></button>
                                <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700" title="Cancel"><X className="w-[20px] h-[20px]" /></button>
                              </div>
                            ) : (
                              <div className="flex gap-3 justify-center items-center h-full">
                                <button onClick={() => handleEdit(user)} className="text-[#2348CD] hover:opacity-75 transition-opacity" title="Edit"><Edit className="w-[20px] h-[20px]" /></button>
                                <button onClick={() => handleDelete(user.id)} className="text-[#E0090C] hover:opacity-75 transition-opacity" title="Delete"><Trash2 className="w-[22px] h-[22px]" /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-[#5C626E] text-[16px] font-['Inter'] font-medium">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Desktop Pagination */}
          <div className="py-4 flex items-center justify-between px-2 mt-2">
            <p className="text-[12px] font-['Inter'] font-normal text-[#5C626E] leading-[15px]">
              Showing {paginatedUsers.length} of {filteredUsers.length} entries
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrev} 
                disabled={currentPage === 1} 
                className="w-[15px] h-[15px] flex items-center justify-center rounded-[2px] disabled:opacity-40 hover:bg-white/90 active:bg-white shadow-sm transition-all bg-white/75"
              >
                <svg width="4" height="6" viewBox="0 0 8 10" fill="none"><path d="M6 1L2 5L6 9" stroke="#757B87" strokeWidth="2.5" /></svg>
              </button>
              <span className="text-[#5C626E] font-light font-['Inter'] text-[15px] leading-[18px] min-w-[10px] text-center">{currentPage}</span>
              <button 
                onClick={handleNext} 
                disabled={currentPage === totalPages || totalPages === 0} 
                className="w-[15px] h-[15px] flex items-center justify-center rounded-[2px] disabled:opacity-40 hover:bg-white/90 active:bg-white shadow-sm transition-all bg-white/75"
              >
                <svg width="4" height="6" viewBox="0 0 8 10" fill="none"><path d="M2 1L6 5L2 9" stroke="#757B87" strokeWidth="2.5" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Card View ── */}
        <div className="md:hidden space-y-3 mt-2">
          {paginatedUsers.length > 0 ? paginatedUsers.map((user) => {
            const isEditing = editingUser?.id === user.id;
            const matchingProduct = products.find(p => p.serialPrefix === user.serialPrefix);
            const shortName = matchingProduct?.shortName || user.serialPrefix || '-';
            const priceVal = matchingProduct?.price ? `LKR ${Number(matchingProduct.price).toFixed(2)}` : '-';
            
            return (
              <div key={user.id} className="rounded-[18px] p-4 border border-gray-100 shadow-sm bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    {isEditing
                      ? <input type="text" className="px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B818D] font-semibold text-sm" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
                      : <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '16px', color: '#414141' }}>{user.name}</h3>}
                    <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '12px', color: '#5C626E', marginTop: 2 }}>{user.role}</p>
                  </div>
                  {isEditing
                    ? <select className="px-2 py-1 border border-gray-200 rounded-lg focus:outline-none text-xs" value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })}><option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '17px', background: user.status === 'active' ? '#D1F4D9' : user.status === 'inactive' ? '#FEE2E2' : '#FEF3C7', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500, fontSize: '11px', color: user.status === 'active' ? '#016D18' : user.status === 'inactive' ? '#9B0000' : '#92400E' }}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>}
                </div>
                <div className="space-y-2 mb-3">
                  {[
                    { label: 'Short Name', val: shortName, icon: <Package className="w-4 h-4 text-[#0B818D]" />, edit: isEditing ? <input type="text" className="flex-1 px-2 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm" value={editShortName} onChange={(e) => setEditShortName(e.target.value)} /> : null },
                    { label: 'Serial Prefix', val: user.serialPrefix || '—', icon: <Package className="w-4 h-4 text-[#0B818D]" />, edit: isEditing ? <input type="text" className="flex-1 px-2 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm" value={editingUser!.serialPrefix || ''} onChange={(e) => setEditingUser({ ...editingUser!, serialPrefix: e.target.value })} /> : null },
                    { label: 'Price', val: priceVal, icon: <Package className="w-4 h-4 text-[#0B818D]" />, edit: isEditing ? <input type="text" className="flex-1 px-2 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} /> : null },
                  ].map(({ label, val, icon, edit }) => (
                    <div key={label} className="flex items-center gap-2 pb-1 border-b border-gray-50">
                      {icon}
                      <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 100 }}>{label}</span>
                      {edit || <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px', color: '#414141' }}>{val}</span>}
                    </div>
                  ))}
                  {isEditing && (
                    <div className="flex items-center gap-2 pb-1 border-b border-gray-50">
                      <Shield className="w-4 h-4 text-[#0B818D]" />
                      <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 100 }}>Role</span>
                      <select className="flex-1 px-2 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-sm" value={editingUser!.role} onChange={(e) => setEditingUser({ ...editingUser!, role: e.target.value })}><option value="USER">USER</option><option value="SUPER USER">SUPER USER</option></select>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 pt-2 border-t border-gray-100 justify-end">
                  {isEditing
                    ? <>
                        <button onClick={handleSaveEdit} className="text-[#016D18] hover:text-green-800 transition-colors"><Save className="w-[18px] h-[18px]" /></button>
                        <button onClick={handleCancelEdit} className="text-[#5C626E] hover:text-gray-800 transition-colors"><X className="w-[18px] h-[18px]" /></button>
                      </>
                    : <>
                        <button onClick={() => handleEdit(user)} className="text-[#EAB308] hover:text-yellow-700 transition-colors"><Edit className="w-[18px] h-[18px]" /></button>
                        <button onClick={() => handleDelete(user.id)} className="text-[#EF4444] hover:text-red-700 transition-colors"><Trash2 className="w-[18px] h-[18px]" /></button>
                      </>}
                </div>
              </div>
            );
          }) : (
            <div className="rounded-[18px] p-10 text-center bg-gray-50 border border-gray-100 text-sm text-[#5C626E]">No users found</div>
          )}
          
          {/* Mobile Pagination */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-xs text-[#5C626E]">Showing {paginatedUsers.length} of {filteredUsers.length} entries</p>
            <div className="flex items-center gap-2">
              <button onClick={handlePrev} disabled={currentPage === 1} className="px-3 py-1 rounded-lg text-sm border border-gray-200 disabled:opacity-50 bg-white text-[#5C626E]">Prev</button>
              <span className="text-[13px] text-[#5C626E]">{currentPage} / {totalPages || 1}</span>
              <button onClick={handleNext} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 rounded-lg text-sm border border-gray-200 disabled:opacity-50 bg-white text-[#5C626E]">Next</button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
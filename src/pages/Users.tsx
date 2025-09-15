import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, X, Save, User, Mail, Calendar, Shield, Phone, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { userApi, productApi } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface User {
  id: string;
  email: string;
  name: string;
  registration_date: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  contact: string;
  productId?: number;
  productName?: string;
}

export const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState<{ productId: number; name: string }[]>([]);
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    email: '',
    name: '',
    registration_date: new Date().toISOString().split('T')[0],
    role: 'User',
    status: 'pending',
    contact: '',
    productId: undefined,
    productName: undefined
  });

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.role.toLowerCase().includes(searchTermLower) ||
      user.contact.toLowerCase().includes(searchTermLower)
    );
  });

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Handle user deletion
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.deleteUser(id);
        setUsers(users.filter(user => user.id !== id));
        showToast('User deleted successfully!', 'success');
      } catch (error) {
        console.error('Failed to delete user:', error);
        showToast('Failed to delete user. Please try again.', 'error');
      }
    }
  };

  // Handle user editing
  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
  };

  // Handle save edit
  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    toast[type](message, {
      position: "top-right",
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
        const updatedUser = await userApi.updateUser(editingUser.id, {
          name: editingUser.name,
          email: editingUser.email,
          contact: editingUser.contact,
          role: editingUser.role
        });
        
        // Update the local state with the updated user data
        setUsers(users.map(user => 
          user.id === updatedUser.id ? { ...updatedUser, productId: editingUser.productId, productName: editingUser.productName } : user
        ));
        setEditingUser(null);
        showToast('User updated successfully!', 'success');
      } catch (error) {
        console.error('Failed to update user:', error);
        showToast('Failed to update user. Please try again.', 'error');
      }
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  // Handle add new user
  const handleAddUser = () => {
    const userToAdd: User = {
      ...newUser,
      id: Date.now().toString()
    };
    setUsers([...users, userToAdd]);
    setNewUser({
      email: '',
      name: '',
      registration_date: new Date().toISOString().split('T')[0],
      role: 'User',
      status: 'pending',
      contact: ''
    });
    setShowAddForm(false);
    showToast('User added successfully!', 'success');
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
    Promise.all([
      userApi.getAllUsers(),
      productApi.getAllProducts()
    ])
    .then(([usersData, productsData]) => {
      setUsers(usersData);
      setProducts(productsData.map(p => ({ productId: p.productId || 0, name: p.name })));
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
              <option value="User">User</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
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
            <div>
              <select
                id="product"
                value={newUser.productId || ''}
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.productId === Number(e.target.value));
                  setNewUser({
                    ...newUser,
                    productId: Number(e.target.value),
                    productName: selectedProduct?.name
                  });
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.productId} value={product.productId}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="date"
              value={newUser.registration_date}
              onChange={(e) => setNewUser({ ...newUser, registration_date: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddUser}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Add User
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

      {/* Users Table */}
      <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl shadow-sm">
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
              <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </div>
              </th>
              <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Product
                </div>
              </th>
              <th className="w-[11%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
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
                      <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {editingUser?.id === user.id ? (
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
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
                        onChange={(e) => setEditingUser({ ...editingUser, contact: e.target.value })}
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
                        <option value="User">User</option>
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                    ) : (
                      <div className="text-sm text-gray-500 truncate">{user.role}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusDisplay(user.status).color}`}>
                        {user.status}
                      </span>
                      {getStatusDisplay(user.status).icon}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.registration_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {editingUser?.id === user.id ? (
                      <select
                        value={editingUser.productId || ''}
                        onChange={(e) => {
                          const selectedProduct = products.find(p => p.productId === Number(e.target.value));
                          setEditingUser({
                            ...editingUser,
                            productId: Number(e.target.value),
                            productName: selectedProduct?.name
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        <option value="">Select a product</option>
                        {products.map(product => (
                          <option key={product.productId} value={product.productId}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-gray-500 truncate">
                        {user.productName || 'No product assigned'}
                      </div>
                    )}
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
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
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
          <p className="text-sm text-gray-500">Showing {paginatedUsers.length} of {filteredUsers.length} entries</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
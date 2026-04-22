import { forgotPassword as forgotPasswordAPI, login as loginAPI } from '@services/authService';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Package,
  Shield,
  ShoppingCart,
  UserCheck,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ILoginPayload } from '../../types/auth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState<ILoginPayload>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<ILoginPayload>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [, setPasswordValid] = useState<boolean | null>(null);

  // Real-time email validation
  useEffect(() => {
    if (formData.email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      setEmailValid(emailRegex.test(formData.email.trim()));
    } else {
      setEmailValid(null);
    }
  }, [formData.email]);

  // Real-time password validation
  useEffect(() => {
    if (formData.password) {
      setPasswordValid(formData.password.length >= 6);
    } else {
      setPasswordValid(null);
    }
  }, [formData.password]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ILoginPayload> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setAuthError('');

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await loginAPI({
        email: formData.email,
        password: formData.password,
      });

      const userRoles = response.user?.role || response.user?.roles || [];
      const rolesArray = Array.isArray(userRoles) ? userRoles : (userRoles ? [userRoles] : []);

      const hasAdminRole = rolesArray.some((role: string) =>
        role?.toLowerCase() === 'admin'
      );

      if (!hasAdminRole) {
        setAuthError('You do not have admin privileges. Please contact your administrator.');
        showToast('Access denied: Admin privileges required', 'error');
        setLoading(false);
        return;
      }

      login(response.token, response.user);
      showToast('Login successful!', 'success');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Invalid email or password. Please check your credentials and try again.';
      setAuthError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForgotPasswordEmail = (): boolean => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Email is required');
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(forgotPasswordEmail.trim())) {
      setForgotPasswordError('Please enter a valid email address');
      return false;
    }
    setForgotPasswordError('');
    return true;
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForgotPasswordEmail()) {
      return;
    }

    try {
      setForgotPasswordLoading(true);
      setForgotPasswordError('');

      const response = await forgotPasswordAPI({
        email: forgotPasswordEmail.trim(),
      });

      if (response.success) {
        setForgotPasswordSuccess(true);
        showToast(response.message || 'Password reset code sent to your email', 'success');
        setTimeout(() => {
          navigate('/reset-password', { state: { email: forgotPasswordEmail.trim() } });
        }, 2000);
      } else {
        setForgotPasswordError(response.message || 'Failed to send reset code');
        showToast('Failed to send reset code', 'error');
      }
    } catch (error: unknown) {
      console.error('Forgot password error:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to send reset code. Please try again.';
      setForgotPasswordError(errorMessage);
      showToast('Failed to send reset code', 'error');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const adminFeatures = [
    {
      icon: Users,
      title: 'User Management',
      description: 'Create and manage user accounts securely.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: UserCheck,
      title: 'Dealer Management',
      description: 'Approve, verify, and monitor dealer activities.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Car,
      title: 'Vehicle Management',
      description: 'Comprehensive inventory tracking and updates.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Package,
      title: 'Product Catalog',
      description: 'Manage products, pricing, and stock levels.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: ShoppingCart,
      title: 'Order Processing',
      description: 'Real-time order tracking and fulfillment.',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Deep insights into platform performance.',
      color: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 overflow-hidden">
      {/* LEFT SIDE: Login Form (Card Design) */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 relative overflow-hidden bg-slate-50">
        
        {/* Animated Background Bubbles */}
        <motion.div
           className="absolute -top-20 -left-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"
           animate={{ 
             scale: [1, 1.2, 1],
             x: [0, 20, 0],
             y: [0, 10, 0],
           }}
           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
           className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"
           animate={{ 
             scale: [1, 1.1, 1],
             x: [0, -20, 0],
             y: [0, -10, 0],
           }}
           transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/60 p-8 md:p-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo area */}
              <div className="flex items-center gap-3 mb-10">
                <div className="p-2.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                  <Shield size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">motonode <span className="text-blue-600">Admin</span></h1>
              </div>

              <AnimatePresence mode="wait">
                {!showForgotPassword ? (
                  <motion.div
                    key="login-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                      <p className="text-slate-500">Please sign in to access your dashboard.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Error Message */}
                      <AnimatePresence>
                        {authError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 overflow-hidden"
                          >
                            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm font-medium">{authError}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Email Input */}
                      <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-2 ml-1">Email Address</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Mail size={20} />
                          </div>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                              setFormData({ ...formData, email: e.target.value });
                              setAuthError('');
                              setErrors({ ...errors, email: undefined });
                            }}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            placeholder="admin@example.com"
                            disabled={loading}
                            className={`w-full pl-11 pr-10 py-3.5 rounded-xl bg-slate-50 border-2 transition-all duration-200 outline-none ${
                              emailFocused
                                ? 'border-blue-500 bg-white shadow-lg shadow-blue-100'
                                : errors.email
                                ? 'border-red-300 bg-red-50/50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          />
                          {emailValid === true && (
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                               <CheckCircle2 size={18} />
                             </div>
                          )}
                        </div>
                        {errors.email && <p className="mt-1.5 ml-1 text-red-500 text-sm">{errors.email}</p>}
                      </div>

                      {/* Password Input */}
                      <div>
                        <div className="flex justify-between items-center mb-2 ml-1">
                          <label className="block text-slate-700 text-sm font-semibold">Password</label>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Lock size={20} />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => {
                              setFormData({ ...formData, password: e.target.value });
                              setAuthError('');
                              setErrors({ ...errors, password: undefined });
                            }}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            placeholder="••••••••"
                            disabled={loading}
                            className={`w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-50 border-2 transition-all duration-200 outline-none ${
                               passwordFocused
                                ? 'border-blue-500 bg-white shadow-lg shadow-blue-100'
                                : errors.password
                                ? 'border-red-300 bg-red-50/50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        {errors.password && <p className="mt-1.5 ml-1 text-red-500 text-sm">{errors.password}</p>}
                      </div>

                       <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                              />
                              Signing In...
                            </div>
                          ) : (
                            'Sign In'
                          )}
                        </motion.button>
                    </form>
                  </motion.div>
                ) : forgotPasswordSuccess ? (
                  <motion.div
                    key="forgot-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-8"
                  >
                     <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                       <CheckCircle2 size={40} />
                     </div>
                     <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
                     <p className="text-slate-500 mb-8">
                       We've sent a password reset link to <br /><span className="font-semibold text-slate-900">{forgotPasswordEmail}</span>
                     </p>
                     <button
                       onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordSuccess(false);
                          setForgotPasswordEmail('');
                       }}
                       className="text-blue-600 font-semibold hover:text-blue-700"
                     >
                       Back to Login
                     </button>
                  </motion.div>
                ) : (
                  <motion.div
                     key="forgot-form"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.3 }}
                  >
                     <button 
                       onClick={() => setShowForgotPassword(false)}
                       className="text-slate-500 hover:text-slate-800 text-sm font-medium mb-6 flex items-center gap-1"
                     >
                       ← Back
                     </button>
                     <h2 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h2>
                     <p className="text-slate-500 mb-8">Enter your email to receive reset instructions.</p>
  
                     <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                        <div>
                          <label className="block text-slate-700 text-sm font-semibold mb-2 ml-1">Email Address</label>
                          <input
                            type="email"
                            value={forgotPasswordEmail}
                            onChange={(e) => {
                              setForgotPasswordEmail(e.target.value);
                              setForgotPasswordError('');
                            }}
                            placeholder="admin@example.com"
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition-all"
                          />
                           {forgotPasswordError && <p className="mt-1.5 ml-1 text-red-500 text-sm">{forgotPasswordError}</p>}
                        </div>
                        <motion.button
                          type="submit"
                          disabled={forgotPasswordLoading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-lg hover:bg-slate-800 transition-all duration-200 disabled:opacity-70"
                        >
                           {forgotPasswordLoading ? 'Sending...' : 'Send Link'}
                        </motion.button>
                     </form>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mt-12 pt-6 border-t border-slate-100 text-center text-slate-400 text-sm">
                &copy; 2025 motonode. Secure Admin Portal.
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Feature Tree (Admin Root) */}
      <div className="hidden lg:flex relative overflow-hidden bg-slate-900 items-center justify-center p-8">
        {/* Animated gradients */}
        <motion.div 
           className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl opacity-50"
           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
           transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
           className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl opacity-50"
           animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
           transition={{ duration: 15, repeat: Infinity, delay: 2 }}
        />

        {/* Tree Structure Container */}
        <div className="relative z-10 w-full max-w-5xl h-[600px] flex items-center justify-between gap-12">
          
          {/* SVG Connector Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {adminFeatures.map((_, index) => {
               // Calculate distinct paths from Root (Left-Center) to each Feature (Right-Stack)
               // Root: x=20% (approx center of root card), y=50%
               // Target: x=80% (approx left edge of feature col), y=distributed
               const totalItems = adminFeatures.length;
               const step = 100 / (totalItems + 1); // Distribute vertically
               const targetY = (index + 1) * step; // % height
               
               return (
                 <motion.path
                   key={`path-${index}`}
                   d={`M 180 300 C 300 300, 400 ${targetY * 6}, 500 ${(index * 85) + 60}`} 
                   // Note: Using pixel estimates based on the container height (600px) layout below for better precision than raw % in path d
                   // Adjusting logic:
                   // Root Center: Let's clearly define it. Root div is approx 200px wide. Center ~ 100px.
                   // Container padding left ~ 0.
                   // Actually, let's use flex and draw lines relative to the container.
                   // I'll use a simpler Bezier: Start (200, 300) -> End (RightColX, ItemY)
                   // ItemY approx: Index * 90px (card height + gap) + offset.
                   fill="none"
                   stroke="url(#gradient-line)"
                   strokeWidth="2"
                   strokeOpacity="0.4"
                   initial={{ pathLength: 0, opacity: 0 }}
                   animate={{ pathLength: 1, opacity: 0.4 }}
                   transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                 />
               );
            })}
             <defs>
              <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          {/* ROOT NODE (Human Admin) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-48 flex-shrink-0 flex flex-col items-center justify-center relative z-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center justify-center mb-4 border-4 border-slate-900 relative">
               <Shield size={48} className="text-white" />
               <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-slate-900" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Admin</h2>
            <div className="px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30 mt-2">
              <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">Super User</span>
            </div>
          </motion.div>

          {/* BRANCH NODES (Features) */}
          <div className="flex-1 flex flex-col gap-4 relative z-20">
             {adminFeatures.map((feature, idx) => {
               const Icon = feature.icon;
               return (
                 <motion.div
                   key={idx}
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.4 + (idx * 0.1), duration: 0.5 }}
                   className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 transition-all cursor-default group w-full max-w-md ml-auto"
                 >
                   <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color} flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                     <Icon size={18} className="text-white" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="text-slate-200 font-semibold text-sm truncate">{feature.title}</h3>
                     <p className="text-slate-500 text-xs truncate">{feature.description}</p>
                   </div>
                   <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors" />
                 </motion.div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};

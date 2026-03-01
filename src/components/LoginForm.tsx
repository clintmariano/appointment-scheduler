import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(username, password);
    
    if (!success) {
      setError('Invalid username or password');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Logo Card */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">MyOB</h1>
          <p className="text-teal-100 text-sm">Obstetric Appointment Scheduler</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors bg-gray-50"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors bg-gray-50"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2">
                <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                <span className="text-red-600 text-xs">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-md hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Demo Credentials</p>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-teal-50 rounded-lg p-2 text-center">
                <p className="font-semibold text-teal-700">Doctor</p>
                <p className="text-teal-600">doctor</p>
                <p className="text-teal-500">doctor123</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="font-semibold text-gray-700">Staff 1</p>
                <p className="text-gray-600">assistant1</p>
                <p className="text-gray-500">assistant123</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="font-semibold text-gray-700">Staff 2</p>
                <p className="text-gray-600">assistant2</p>
                <p className="text-gray-500">assistant123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
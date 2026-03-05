import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api'; // storage বাদ দিয়ে api ব্যবহার করছি
import { Heart, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Login request
        const user = await api.login(email, password);
        // MongoDB এর '_id' কে 'id' তে কনভার্ট করে সেভ করছি
        const mappedUser = { ...user, id: user._id };
        localStorage.setItem('lunaflow_session', JSON.stringify(mappedUser));
        onLogin(mappedUser);
      } else {
        // Register request
        if (!name || !email || !password) {
          setError('Please fill in all fields.');
          return;
        }
        const newUserRequest = { id: '', email, password, name };
        const savedUser = await api.register(newUserRequest);
        const mappedUser = { ...savedUser, id: savedUser._id };
        localStorage.setItem('lunaflow_session', JSON.stringify(mappedUser));
        onLogin(mappedUser);
      }
    } catch (err: any) {
      setError('Authentication failed. Check email/password or server connection.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500 rounded-2xl text-white shadow-xl shadow-rose-200 mb-4 animate-bounce-slow">
            <Heart size={32} fill="white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">LunaFlow</h1>
          <p className="text-slate-500 mt-2">Smart Menstrual Health Tracker</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 transition-all">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Join LunaFlow'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 group"
            >
              {isLogin ? 'Login' : 'Create Account'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center text-slate-500 text-sm">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-rose-500 font-bold hover:underline ml-1"
                >
                  Register now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-rose-500 font-bold hover:underline ml-1"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
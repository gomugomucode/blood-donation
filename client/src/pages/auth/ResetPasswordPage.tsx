import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service.js';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!token.trim()) {
      setErrorMessage('A valid password reset token is required.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        token: token.trim(),
        newPassword,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Password reset failed. The token may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card border border-[#E7E5E4] p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#FFF0F2] text-[#D92D45] rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#FFE4E8] shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1F2937] tracking-tight">Set New Password</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-2">
            Please choose a strong password with at least 8 characters.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl flex items-start gap-3 text-[#B42318] text-xs">
            <AlertCircle className="w-5 h-5 text-[#B42318] shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-start gap-3 text-[#15803D] text-xs text-left">
              <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
              <span>
                Your password has been successfully updated! Redirecting you to login...
              </span>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-[#D92D45] hover:bg-[#B42318] text-white font-bold text-xs rounded-xl transition shadow-xs"
            >
              Log In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!tokenFromUrl && (
              <div>
                <label htmlFor="token" className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
                  Reset Token
                </label>
                <input
                  id="token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your reset token here"
                  className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl text-[#1F2937] placeholder:text-[#9CA3AF] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#D92D45]/20 focus:border-[#D92D45] transition"
                />
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl text-[#1F2937] placeholder:text-[#9CA3AF] text-xs focus:outline-none focus:ring-2 focus:ring-[#D92D45]/20 focus:border-[#D92D45] transition"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl text-[#1F2937] placeholder:text-[#9CA3AF] text-xs focus:outline-none focus:ring-2 focus:ring-[#D92D45]/20 focus:border-[#D92D45] transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#D92D45] hover:bg-[#B42318] active:bg-[#8F1D35] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

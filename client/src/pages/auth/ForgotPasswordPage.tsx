import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service.js';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [devResetToken, setDevResetToken] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await authService.forgotPassword({ email });
      setIsSuccess(true);
      if (result.devResetToken) {
        setDevResetToken(result.devResetToken);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card border border-[#E7E5E4] p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#FFF0F2] text-[#D92D45] rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#FFE4E8] shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1F2937] tracking-tight">Forgot Password</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-2">
            Enter your registered email address and we'll send you instructions to reset your password.
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
                If an account with <strong>{email}</strong> exists, password reset instructions have been dispatched.
              </span>
            </div>

            {devResetToken && (
              <div className="p-4 bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl text-left text-xs text-[#78350F] font-mono">
                <div className="font-semibold mb-1 text-[#92400E]">Development Reset Token:</div>
                <div className="break-all select-all p-2 bg-[#FEF3C7] rounded mb-2">{devResetToken}</div>
                <Link
                  to={`/reset-password?token=${devResetToken}`}
                  className="inline-flex items-center text-[#B45309] underline font-sans font-medium text-xs hover:text-[#78350F]"
                >
                  Proceed to Reset Password &rarr;
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#D92D45] hover:text-[#B42318]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="donor@example.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl text-[#1F2937] placeholder:text-[#9CA3AF] text-xs focus:outline-none focus:ring-2 focus:ring-[#D92D45]/20 focus:border-[#D92D45] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#D92D45] hover:bg-[#B42318] active:bg-[#8F1D35] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Instructions...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#667085] hover:text-[#1F2937] transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

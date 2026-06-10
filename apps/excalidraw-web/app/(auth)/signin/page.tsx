"use client";
import axios from "axios";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";

type Inputs = {
  email: string;
  password: string;
};

export default function App() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const { email, password } = data;
    const response = await axios.post(`${process.env.NEXT_PUBLIC_HTTP_URL}/signin`, {
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      redirect("/dashboard")
    } else {
      alert(response.data.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              {...register("email", { required: true })}
              placeholder="Enter your email"
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {errors.email && (
              <span className="text-red-500 text-sm mt-1 block">
                Email is required
              </span>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              {...register("password", { required: true })}
              placeholder="Enter your password"
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {errors.password && (
              <span className="text-red-500 text-sm mt-1 block">
                Password is required
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors duration-200 mt-6"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-slate-800 font-medium hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
